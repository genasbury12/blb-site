-- The BOSS Business System
-- Migration 0200: catalog of products and prices, orders, subscriptions, entitlements, billing events.
-- Decisions: D04 (prices), D05 (six payment schedule), D06 (windows), D07 (grace, disputes, refunds), D09.
-- Grants are created only by server code (service role) from verified Stripe events, or by an
-- admin override that requires a reason and writes the audit log.

-- ---------------------------------------------------------------------------
-- Feature keys (handoff 03). admin.manage is a role, not a purchasable grant.
-- ---------------------------------------------------------------------------
create type public.feature_key as enum (
  'curriculum.read',
  'audit.use',
  'library.read',
  'roadmap.use',
  'group_coaching.access',
  'community.access',
  'feedback.submit',
  'workshops.access',
  'hotseat.apply',
  'elite_coaching.access',
  'elite_board.access',
  'elite_dfu_hours.use'
);

-- ---------------------------------------------------------------------------
-- Products and prices (D04). Stripe price IDs are per environment and set by an admin,
-- never hardcoded (D05).
-- ---------------------------------------------------------------------------
create type public.product_kind as enum ('program', 'subscription');

create table public.products (
  sku text primary key check (sku ~ '^[a-z_]{3,40}$'),
  title text not null,
  kind public.product_kind not null,
  curriculum_months int check (curriculum_months is null or curriculum_months between 1 and 60),
  coaching_months int check (coaching_months is null or coaching_months between 1 and 24),
  dfy_extension_days int check (dfy_extension_days is null or dfy_extension_days between 0 and 365),
  requires_application boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create trigger products_touch before update on public.products for each row execute function app.touch_updated_at();
create policy "anyone reads active products" on public.products
  for select to anon, authenticated using (active);
create policy "admins read all products" on public.products
  for select to authenticated using (app.is_admin());

create type public.payment_plan as enum ('pay_in_full', 'six_installments', 'monthly');

create table public.prices (
  id uuid primary key default gen_random_uuid(),
  sku text not null references public.products (sku),
  plan public.payment_plan not null,
  amount_cents int not null check (amount_cents > 0),
  installment_count int not null default 1 check (installment_count between 1 and 12),
  currency text not null default 'usd' check (currency = 'usd'),
  stripe_price_id text check (stripe_price_id is null or stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sku, plan),
  check ((plan = 'six_installments') = (installment_count = 6))
);
alter table public.prices enable row level security;
create trigger prices_touch before update on public.prices for each row execute function app.touch_updated_at();
create policy "anyone reads active prices" on public.prices
  for select to anon, authenticated using (active);
create policy "admins read all prices" on public.prices
  for select to authenticated using (app.is_admin());

-- Which features a product grants and over which window.
create type public.grant_window as enum ('curriculum', 'coaching', 'coaching_plus_dfy_extension', 'subscription_period');

create table public.product_features (
  sku text not null references public.products (sku) on delete cascade,
  feature_key public.feature_key not null,
  window_kind public.grant_window not null,
  primary key (sku, feature_key)
);
alter table public.product_features enable row level security;
create policy "anyone reads product features" on public.product_features
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Orders (one time and six installment programs)
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'pending',                 -- checkout created, not paid
  'paid',                    -- paid in full
  'installments_current',    -- six payment plan, up to date
  'installments_past_due',   -- a scheduled installment failed; see past_due_since
  'installments_completed',  -- sixth successful installment collected
  'canceled',                -- canceled by admin (for example written off)
  'refunded',
  'disputed',
  'expired'                  -- checkout expired unpaid
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  sku text not null references public.products (sku),
  price_id uuid not null references public.prices (id),
  payment_plan public.payment_plan not null,
  status public.order_status not null default 'pending',
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'usd',
  installments_total int not null default 1 check (installments_total in (1, 6)),
  installments_paid int not null default 0 check (installments_paid >= 0),
  first_paid_at timestamptz,
  past_due_since timestamptz,
  checkout_session_id text unique,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text unique,
  stripe_schedule_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (installments_paid <= installments_total),
  check (status <> 'installments_past_due' or past_due_since is not null)
);
create index orders_user_idx on public.orders (user_id);
alter table public.orders enable row level security;
create trigger orders_touch before update on public.orders for each row execute function app.touch_updated_at();
create policy "read own orders" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "admins read orders" on public.orders
  for select to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- Subscriptions (graduate coaching, Elite board retention)
-- ---------------------------------------------------------------------------
create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'incomplete', 'unpaid');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sku text not null references public.products (sku),
  stripe_subscription_id text unique,
  status public.subscription_status not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  past_due_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end > current_period_start)
);
create index subscriptions_user_idx on public.subscriptions (user_id);
alter table public.subscriptions enable row level security;
create trigger subscriptions_touch before update on public.subscriptions for each row execute function app.touch_updated_at();
create policy "read own subscriptions" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "admins read subscriptions" on public.subscriptions
  for select to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- Entitlement grants
-- ---------------------------------------------------------------------------
create type public.grant_source as enum ('order', 'subscription', 'admin_override');
create type public.grant_state as enum ('active', 'suspended', 'revoked');

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature_key public.feature_key not null,
  source_type public.grant_source not null,
  source_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz,
  state public.grant_state not null default 'active',
  manual_override_reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (source_type = 'admin_override' or source_id is not null),
  check (source_type <> 'admin_override' or char_length(coalesce(manual_override_reason, '')) >= 5)
);
-- One grant per feature per source: replayed webhooks cannot duplicate grants.
create unique index entitlements_source_unique
  on public.entitlements (user_id, feature_key, source_type, source_id)
  where source_id is not null;
create index entitlements_lookup_idx on public.entitlements (user_id, feature_key);
alter table public.entitlements enable row level security;
create trigger entitlements_touch before update on public.entitlements for each row execute function app.touch_updated_at();
create policy "read own entitlements" on public.entitlements
  for select to authenticated using (user_id = auth.uid());
create policy "admins read entitlements" on public.entitlements
  for select to authenticated using (app.is_admin());

-- Billing grace (D07): seven calendar days from the first failed due date.
create or replace function app.grace_period()
returns interval
language sql
immutable
set search_path = ''
as $$ select interval '7 days'; $$;

/*
  The single source of access truth.
  A grant counts when it is active, inside its window, and its source is in good standing:
  - order refunded, disputed, canceled or expired: no access (D07 disputes suspend immediately)
  - order or subscription past due: access continues until past_due_since + 7 days, then suspended
  - curing a payment clears past_due_since; original windows are never extended or reset
*/
create or replace function app.has_feature(
  p_feature public.feature_key,
  p_user uuid default auth.uid(),
  p_at timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user is not null and exists (
    select 1
    from public.entitlements e
    left join public.orders o on e.source_type = 'order' and o.id = e.source_id
    left join public.subscriptions s on e.source_type = 'subscription' and s.id = e.source_id
    where e.user_id = p_user
      and e.feature_key = p_feature
      and e.state = 'active'
      and e.starts_at <= p_at
      and (e.ends_at is null or p_at < e.ends_at)
      and (
        e.source_type <> 'order' or (
          o.id is not null
          and o.status in ('paid', 'installments_current', 'installments_past_due', 'installments_completed')
          and (o.past_due_since is null or p_at < o.past_due_since + app.grace_period())
        )
      )
      and (
        e.source_type <> 'subscription' or (
          s.id is not null
          and s.status in ('active', 'past_due', 'canceled')
          and (s.past_due_since is null or p_at < s.past_due_since + app.grace_period())
        )
      )
  );
$$;

-- Users may only ask about themselves; staff checks go through server code.
create or replace function public.my_features(p_at timestamptz default now())
returns setof public.feature_key
language sql
stable
security definer
set search_path = ''
as $$
  select f.k
  from unnest(enum_range(null::public.feature_key)) as f(k)
  where app.has_feature(f.k, auth.uid(), p_at);
$$;
revoke execute on function public.my_features(timestamptz) from public, anon;
grant execute on function public.my_features(timestamptz) to authenticated, service_role;

/*
  Billing notice state for the current user (D07: show a notice during grace).
  Returns the earliest grace deadline among past due orders/subscriptions, or null.
*/
create or replace function public.my_billing_notice()
returns table (source text, past_due_since timestamptz, grace_ends_at timestamptz, suspended boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select 'order', o.past_due_since, o.past_due_since + app.grace_period(), now() >= o.past_due_since + app.grace_period()
  from public.orders o
  where o.user_id = auth.uid() and o.status = 'installments_past_due'
  union all
  select 'subscription', s.past_due_since, s.past_due_since + app.grace_period(), now() >= s.past_due_since + app.grace_period()
  from public.subscriptions s
  where s.user_id = auth.uid() and s.past_due_since is not null and s.status in ('past_due', 'unpaid');
$$;
revoke execute on function public.my_billing_notice() from public, anon;
grant execute on function public.my_billing_notice() to authenticated, service_role;

/*
  Create grants for a paid order. Idempotent: safe under webhook replay and out of order delivery.
  Activation is the first successful payment (D06). Server only.
*/
create or replace function app.grant_order_entitlements(p_order uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_count int := 0;
begin
  select * into v_order from public.orders where id = p_order for update;
  if not found then raise exception 'order % not found', p_order; end if;
  if v_order.user_id is null then raise exception 'order % is not linked to an account', p_order; end if;
  if v_order.first_paid_at is null then raise exception 'order % has no successful payment', p_order; end if;
  if v_order.status not in ('paid', 'installments_current', 'installments_past_due', 'installments_completed') then
    raise exception 'order % is not in a paid state (%).', p_order, v_order.status;
  end if;

  select * into v_product from public.products where sku = v_order.sku;

  insert into public.entitlements (user_id, feature_key, source_type, source_id, starts_at, ends_at)
  select
    v_order.user_id,
    pf.feature_key,
    'order',
    v_order.id,
    v_order.first_paid_at,
    case pf.window_kind
      when 'curriculum' then v_order.first_paid_at + make_interval(months => v_product.curriculum_months)
      when 'coaching' then v_order.first_paid_at + make_interval(months => v_product.coaching_months)
      when 'coaching_plus_dfy_extension' then v_order.first_paid_at
        + make_interval(months => v_product.coaching_months)
        + make_interval(days => coalesce(v_product.dfy_extension_days, 0))
      else null
    end
  from public.product_features pf
  where pf.sku = v_order.sku and pf.window_kind <> 'subscription_period'
  on conflict (user_id, feature_key, source_type, source_id) where source_id is not null do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

/* Revoke grants tied to an order (verified refund, D07). Work is never deleted. */
create or replace function app.revoke_order_entitlements(p_order uuid, p_reason text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare v_count int;
begin
  update public.entitlements
     set state = 'revoked', manual_override_reason = coalesce(manual_override_reason, p_reason)
   where source_type = 'order' and source_id = p_order and state <> 'revoked';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

/* Upsert grants for a subscription to its current paid period (D06). */
create or replace function app.sync_subscription_entitlements(p_subscription uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_count int;
begin
  select * into v_sub from public.subscriptions where id = p_subscription for update;
  if not found then raise exception 'subscription % not found', p_subscription; end if;

  insert into public.entitlements (user_id, feature_key, source_type, source_id, starts_at, ends_at)
  select v_sub.user_id, pf.feature_key, 'subscription', v_sub.id, v_sub.current_period_start, v_sub.current_period_end
  from public.product_features pf
  where pf.sku = v_sub.sku and pf.window_kind = 'subscription_period'
  on conflict (user_id, feature_key, source_type, source_id) where source_id is not null
  do update set ends_at = greatest(public.entitlements.ends_at, excluded.ends_at);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function app.grant_order_entitlements(uuid) from public, anon, authenticated;
revoke execute on function app.revoke_order_entitlements(uuid, text) from public, anon, authenticated;
revoke execute on function app.sync_subscription_entitlements(uuid) from public, anon, authenticated;
grant execute on function app.grant_order_entitlements(uuid) to service_role;
grant execute on function app.revoke_order_entitlements(uuid, text) to service_role;
grant execute on function app.sync_subscription_entitlements(uuid) to service_role;

/*
  Admin override (D07, D09): requires admin role and a written reason, always audited.
*/
create or replace function public.admin_grant_entitlement(
  p_user uuid,
  p_feature public.feature_key,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not app.is_admin() then
    raise exception 'admin role required' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'a reason of at least 5 characters is required';
  end if;
  insert into public.entitlements (user_id, feature_key, source_type, source_id, starts_at, ends_at, manual_override_reason, created_by)
  values (p_user, p_feature, 'admin_override', null, p_starts_at, p_ends_at, trim(p_reason), auth.uid())
  returning id into v_id;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason)
  values (auth.uid(), 'entitlement.grant', 'entitlement', v_id::text,
          jsonb_build_object('user_id', p_user, 'feature_key', p_feature, 'starts_at', p_starts_at, 'ends_at', p_ends_at),
          trim(p_reason));
  return v_id;
end;
$$;

create or replace function public.admin_set_entitlement_state(
  p_entitlement uuid,
  p_state public.grant_state,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_old public.grant_state;
begin
  if not app.is_admin() then
    raise exception 'admin role required' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'a reason of at least 5 characters is required';
  end if;
  select state into v_old from public.entitlements where id = p_entitlement for update;
  if not found then raise exception 'entitlement not found'; end if;
  update public.entitlements set state = p_state where id = p_entitlement;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason)
  values (auth.uid(), 'entitlement.state', 'entitlement', p_entitlement::text,
          jsonb_build_object('from', v_old, 'to', p_state), trim(p_reason));
end;
$$;
revoke execute on function public.admin_grant_entitlement(uuid, public.feature_key, timestamptz, timestamptz, text) from public, anon;
revoke execute on function public.admin_set_entitlement_state(uuid, public.grant_state, text) from public, anon;
grant execute on function public.admin_grant_entitlement(uuid, public.feature_key, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.admin_set_entitlement_state(uuid, public.grant_state, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Stripe webhook event ledger (idempotency). No client access at all.
-- ---------------------------------------------------------------------------
create table public.billing_events (
  stripe_event_id text primary key,
  type text not null,
  stripe_created_at timestamptz,
  payload_sha256 text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  outcome text,
  error text
);
alter table public.billing_events enable row level security;
revoke all on public.billing_events from anon, authenticated;
grant select on public.billing_events to authenticated;
create policy "admins read billing events" on public.billing_events
  for select to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- Approved catalog (D04). Stripe price IDs are attached per environment later.
-- ---------------------------------------------------------------------------
insert into public.products (sku, title, kind, curriculum_months, coaching_months, dfy_extension_days, requires_application) values
  ('blueprint',          'BOSS Blueprint',               'program',      12, null, null, false),
  ('accelerator',        'BOSS Accelerator',             'program',      12, 6,    null, false),
  ('elite',              'BOSS Elite',                   'program',      12, 6,    30,   true),
  ('graduate_coaching',  'Graduate Coaching Membership', 'subscription', null, null, null, false),
  ('elite_board',        'Elite Board Retention',        'subscription', null, null, null, false);

insert into public.prices (sku, plan, amount_cents, installment_count) values
  ('blueprint',         'pay_in_full',       49700, 1),
  ('blueprint',         'six_installments',   9700, 6),
  ('accelerator',       'pay_in_full',      149700, 1),
  ('accelerator',       'six_installments',  29700, 6),
  ('elite',             'pay_in_full',      499700, 1),
  ('elite',             'six_installments',  89700, 6),
  ('graduate_coaching', 'monthly',            9700, 1),
  ('elite_board',       'monthly',            9700, 1);

insert into public.product_features (sku, feature_key, window_kind)
select 'blueprint', f::public.feature_key, 'curriculum'
from unnest(array['curriculum.read', 'audit.use', 'library.read', 'roadmap.use']) f;

insert into public.product_features (sku, feature_key, window_kind)
select p.sku, f::public.feature_key, 'curriculum'
from (values ('accelerator'), ('elite')) p(sku),
     unnest(array['curriculum.read', 'audit.use', 'library.read', 'roadmap.use']) f;

insert into public.product_features (sku, feature_key, window_kind)
select p.sku, f::public.feature_key, 'coaching'
from (values ('accelerator'), ('elite')) p(sku),
     unnest(array['group_coaching.access', 'community.access', 'feedback.submit', 'workshops.access', 'hotseat.apply']) f;

insert into public.product_features (sku, feature_key, window_kind) values
  ('elite', 'elite_coaching.access', 'coaching'),
  ('elite', 'elite_board.access', 'coaching'),
  ('elite', 'elite_dfu_hours.use', 'coaching_plus_dfy_extension');

-- Graduate: curriculum extension plus group support, no feedback, no 1:1, no DFY (D06, handoff 03).
insert into public.product_features (sku, feature_key, window_kind)
select 'graduate_coaching', f::public.feature_key, 'subscription_period'
from unnest(array['curriculum.read', 'audit.use', 'library.read', 'roadmap.use',
                  'group_coaching.access', 'community.access', 'workshops.access', 'hotseat.apply']) f;

-- Elite board retention: private board only (D06).
insert into public.product_features (sku, feature_key, window_kind) values
  ('elite_board', 'elite_board.access', 'subscription_period');
