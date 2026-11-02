-- The BOSS Business System
-- Migration 0800: Stripe billing ledger (test mode until owner approval).
-- Decisions: D04 prices, D05 fixed six payment schedule (stops after the sixth successful collection),
-- D06 windows, D07 grace, disputes, refunds, D09 grants only from verified Stripe events.
-- Design: every Stripe fact is applied by an idempotent, order independent SQL function. The order's
-- status, installment count, grace start and grants are always recomputed from the payment ledger,
-- so duplicate or out of order webhooks converge to the same state.

alter type public.subscription_status add value if not exists 'trialing';

create table public.stripe_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);
alter table public.stripe_customers enable row level security;
create policy "read own stripe customer" on public.stripe_customers for select to authenticated using (user_id = auth.uid());
create policy "admins read stripe customers" on public.stripe_customers for select to authenticated using (app.is_admin());

alter table public.orders
  add column pre_dispute_status public.order_status,
  add column refunded_cents int not null default 0,
  add column completed_at timestamptz;

create type public.payment_state as enum ('paid', 'failed', 'refunded');

-- One row per invoice (installments) or per payment intent (pay in full). order_id may be filled
-- in later when an invoice arrives before checkout completion (out of order delivery).
create table public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  stripe_subscription_id text,
  stripe_invoice_id text unique,
  stripe_payment_intent_id text unique,
  amount_cents int not null default 0 check (amount_cents >= 0),
  state public.payment_state not null,
  due_at timestamptz,
  paid_at timestamptz,
  refunded_cents int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stripe_invoice_id is not null or stripe_payment_intent_id is not null)
);
create index order_payments_order_idx on public.order_payments (order_id);
create index order_payments_sub_idx on public.order_payments (stripe_subscription_id);
alter table public.order_payments enable row level security;
create trigger order_payments_touch before update on public.order_payments for each row execute function app.touch_updated_at();
create policy "read own payments" on public.order_payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "admins read payments" on public.order_payments for select to authenticated using (app.is_admin());

-- Situations that need a human: partial refunds, an unexpected seventh charge, disputes, unknown objects.
create table public.billing_exceptions (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  order_id uuid references public.orders (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  stripe_object_id text,
  detail jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now()
);
alter table public.billing_exceptions enable row level security;
create policy "admins read billing exceptions" on public.billing_exceptions for select to authenticated using (app.is_admin());
create policy "admins resolve billing exceptions" on public.billing_exceptions for update to authenticated
  using (app.is_admin()) with check (app.is_admin() and resolved_by = auth.uid() and char_length(coalesce(resolution_note, '')) >= 5);

-- ---------------------------------------------------------------------------
-- Event ledger helpers
-- ---------------------------------------------------------------------------
create or replace function public.billing_record_event(p_id text, p_type text, p_created timestamptz, p_sha text)
returns boolean
language plpgsql
set search_path = ''
as $$
declare v_processed timestamptz;
begin
  insert into public.billing_events (stripe_event_id, type, stripe_created_at, payload_sha256)
  values (p_id, p_type, p_created, p_sha)
  on conflict (stripe_event_id) do nothing;
  if found then return true; end if;
  select processed_at into v_processed from public.billing_events where stripe_event_id = p_id;
  return v_processed is null; -- an earlier attempt failed: process again
end;
$$;

create or replace function public.billing_mark_event(p_id text, p_outcome text, p_error text)
returns void
language sql
set search_path = ''
as $$
  update public.billing_events
     set processed_at = case when p_error is null then now() else null end,
         outcome = p_outcome,
         error = left(p_error, 1000)
   where stripe_event_id = p_id;
$$;

-- ---------------------------------------------------------------------------
-- Recompute an order from its payments. Returns a summary used by the webhook handler.
-- ---------------------------------------------------------------------------
create or replace function app.billing_recompute_order(p_order uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders%rowtype;
  v_paid int;
  v_first timestamptz;
  v_failed_since timestamptz;
  v_refunded int;
  v_paid_cents int;
  v_status public.order_status;
  v_granted int := 0;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then return '{}'::jsonb; end if;

  select count(*) filter (where state in ('paid', 'refunded')),
         min(paid_at) filter (where state in ('paid', 'refunded')),
         min(due_at) filter (where state = 'failed'),
         coalesce(sum(refunded_cents), 0),
         coalesce(sum(amount_cents) filter (where state in ('paid', 'refunded')), 0)
    into v_paid, v_first, v_failed_since, v_refunded, v_paid_cents
    from public.order_payments where order_id = p_order;

  if o.status in ('refunded', 'disputed', 'canceled') then
    v_status := o.status;
  elsif o.payment_plan = 'pay_in_full' then
    v_status := case when v_paid >= 1 then 'paid' else o.status end;
  elsif v_paid >= o.installments_total then
    v_status := 'installments_completed';
  elsif v_failed_since is not null then
    v_status := 'installments_past_due';
  elsif v_paid >= 1 then
    v_status := 'installments_current';
  else
    v_status := o.status;
  end if;

  update public.orders
     set installments_paid = least(v_paid, installments_total),
         first_paid_at = coalesce(o.first_paid_at, v_first),
         past_due_since = case when v_status = 'installments_past_due' then v_failed_since else null end,
         refunded_cents = v_refunded,
         status = v_status,
         completed_at = case when v_status = 'installments_completed' then coalesce(o.completed_at, now()) else o.completed_at end
   where id = p_order;

  if v_status in ('paid', 'installments_current', 'installments_past_due', 'installments_completed')
     and o.user_id is not null and coalesce(o.first_paid_at, v_first) is not null then
    v_granted := app.grant_order_entitlements(p_order);
  end if;

  if v_paid > o.installments_total then
    insert into public.billing_exceptions (kind, order_id, detail)
    select 'extra_installment_collected', p_order, jsonb_build_object('paid_count', v_paid)
    where not exists (select 1 from public.billing_exceptions where kind = 'extra_installment_collected' and order_id = p_order and resolved_at is null);
  end if;

  return jsonb_build_object(
    'order_id', p_order,
    'status', v_status,
    'paid_count', v_paid,
    'installments_total', o.installments_total,
    'stop_schedule', o.payment_plan = 'six_installments' and v_paid >= o.installments_total,
    'stripe_subscription_id', o.stripe_subscription_id,
    'granted', v_granted
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- checkout.session.created (by our server) and checkout.session.completed / expired (webhook)
-- ---------------------------------------------------------------------------
create or replace function public.billing_apply_checkout(p jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_price public.prices%rowtype;
  v_order uuid;
  v_plan public.payment_plan := (p ->> 'plan')::public.payment_plan;
begin
  select * into v_price from public.prices where sku = p ->> 'sku' and plan = v_plan;
  if not found then raise exception 'unknown price % %', p ->> 'sku', p ->> 'plan'; end if;
  if v_plan = 'monthly' then
    raise exception 'subscriptions are recorded from subscription events, not orders';
  end if;

  insert into public.orders (user_id, email, sku, price_id, payment_plan, status, amount_cents, installments_total,
                             checkout_session_id, stripe_customer_id, stripe_payment_intent_id, stripe_subscription_id)
  values ((p ->> 'user_id')::uuid, p ->> 'email', v_price.sku, v_price.id, v_plan, 'pending', v_price.amount_cents,
          v_price.installment_count, p ->> 'session_id', p ->> 'customer_id', p ->> 'payment_intent_id', p ->> 'subscription_id')
  on conflict (checkout_session_id) do update set
    stripe_customer_id = coalesce(excluded.stripe_customer_id, public.orders.stripe_customer_id),
    stripe_payment_intent_id = coalesce(excluded.stripe_payment_intent_id, public.orders.stripe_payment_intent_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.orders.stripe_subscription_id),
    email = coalesce(public.orders.email, excluded.email),
    status = case when p ->> 'session_status' = 'expired' and public.orders.status = 'pending' then 'expired'::public.order_status else public.orders.status end
  returning id into v_order;

  if p ->> 'customer_id' is not null and p ->> 'user_id' is not null then
    insert into public.stripe_customers (user_id, stripe_customer_id) values ((p ->> 'user_id')::uuid, p ->> 'customer_id')
    on conflict do nothing;
  end if;

  -- Pay in full: a paid session is the payment.
  if v_plan = 'pay_in_full' and p ->> 'payment_status' = 'paid' and p ->> 'payment_intent_id' is not null then
    insert into public.order_payments (order_id, stripe_payment_intent_id, amount_cents, state, paid_at)
    values (v_order, p ->> 'payment_intent_id', coalesce((p ->> 'amount_cents')::int, v_price.amount_cents), 'paid',
            coalesce((p ->> 'paid_at')::timestamptz, now()))
    on conflict (stripe_payment_intent_id) do update set order_id = excluded.order_id;
  end if;

  -- Installments: attach any invoices that arrived before this event.
  if p ->> 'subscription_id' is not null then
    update public.order_payments set order_id = v_order
     where stripe_subscription_id = p ->> 'subscription_id' and order_id is null;
  end if;

  return app.billing_recompute_order(v_order);
end;
$$;

-- ---------------------------------------------------------------------------
-- invoice.paid / invoice.payment_failed for installment orders and subscriptions
-- ---------------------------------------------------------------------------
create or replace function public.billing_apply_invoice(p jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_state public.payment_state := (p ->> 'state')::public.payment_state;
  v_sub text := p ->> 'subscription_id';
  v_order uuid;
  v_subscription public.subscriptions%rowtype;
begin
  insert into public.order_payments (stripe_subscription_id, stripe_invoice_id, amount_cents, state, due_at, paid_at)
  values (v_sub, p ->> 'invoice_id', coalesce((p ->> 'amount_cents')::int, 0), v_state,
          (p ->> 'due_at')::timestamptz, case when v_state = 'paid' then coalesce((p ->> 'paid_at')::timestamptz, now()) end)
  on conflict (stripe_invoice_id) do update set
    -- A paid invoice never goes back to failed, whatever order the events arrive in.
    state = case when public.order_payments.state in ('paid', 'refunded') then public.order_payments.state else excluded.state end,
    paid_at = coalesce(public.order_payments.paid_at, excluded.paid_at),
    amount_cents = greatest(public.order_payments.amount_cents, excluded.amount_cents),
    due_at = coalesce(public.order_payments.due_at, excluded.due_at),
    stripe_subscription_id = coalesce(public.order_payments.stripe_subscription_id, excluded.stripe_subscription_id);

  select id into v_order from public.orders where stripe_subscription_id = v_sub;
  if v_order is not null then
    update public.order_payments set order_id = v_order where stripe_invoice_id = p ->> 'invoice_id' and order_id is null;
    return app.billing_recompute_order(v_order);
  end if;

  select * into v_subscription from public.subscriptions where stripe_subscription_id = v_sub;
  if found then
    if v_state = 'failed' then
      update public.subscriptions set past_due_since = coalesce(past_due_since, (p ->> 'due_at')::timestamptz, now()) where id = v_subscription.id;
    elsif not exists (select 1 from public.order_payments where stripe_subscription_id = v_sub and state = 'failed') then
      update public.subscriptions set past_due_since = null where id = v_subscription.id;
    end if;
    return jsonb_build_object('subscription_id', v_subscription.id);
  end if;

  return jsonb_build_object('pending_link', true);
end;
$$;

-- invoice_payment.paid: remember which payment intent paid which invoice (needed for refunds and disputes).
create or replace function public.billing_link_payment_intent(p_invoice text, p_payment_intent text)
returns void
language sql
set search_path = ''
as $$
  update public.order_payments set stripe_payment_intent_id = p_payment_intent
   where stripe_invoice_id = p_invoice and stripe_payment_intent_id is null;
$$;

-- ---------------------------------------------------------------------------
-- customer.subscription.* for graduate coaching and Elite board retention
-- ---------------------------------------------------------------------------
create or replace function public.billing_apply_subscription(p jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
  v_status public.subscription_status := (p ->> 'status')::public.subscription_status;
  v_sku text := p ->> 'sku';
begin
  if v_sku not in ('graduate_coaching', 'elite_board') then
    -- Installment schedules are tracked on orders; record cancellation timing only.
    return jsonb_build_object('ignored', true);
  end if;
  if p ->> 'user_id' is null then raise exception 'subscription % has no user metadata', p ->> 'stripe_subscription_id'; end if;

  insert into public.subscriptions (user_id, sku, stripe_subscription_id, status, current_period_start, current_period_end,
                                    cancel_at_period_end, canceled_at)
  values ((p ->> 'user_id')::uuid, v_sku, p ->> 'stripe_subscription_id', v_status, (p ->> 'current_period_start')::timestamptz,
          (p ->> 'current_period_end')::timestamptz, coalesce((p ->> 'cancel_at_period_end')::boolean, false), (p ->> 'canceled_at')::timestamptz)
  on conflict (stripe_subscription_id) do update set
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = greatest(public.subscriptions.current_period_end, excluded.current_period_end),
    cancel_at_period_end = excluded.cancel_at_period_end,
    canceled_at = excluded.canceled_at,
    past_due_since = case when excluded.status in ('active', 'trialing') then null
                          when excluded.status in ('past_due', 'unpaid') then coalesce(public.subscriptions.past_due_since, now())
                          else public.subscriptions.past_due_since end
  returning id into v_id;

  perform app.sync_subscription_entitlements(v_id);
  return jsonb_build_object('subscription_id', v_id, 'status', v_status);
end;
$$;

-- ---------------------------------------------------------------------------
-- charge.refunded: full refunds revoke; partial refunds become an exception for review (D07, D08)
-- ---------------------------------------------------------------------------
create or replace function public.billing_apply_refund(p jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_pi text := p ->> 'payment_intent_id';
  v_pay public.order_payments%rowtype;
  v_order public.orders%rowtype;
  v_total_paid int;
  v_total_refunded int;
begin
  select * into v_pay from public.order_payments where stripe_payment_intent_id = v_pi;
  if not found then
    insert into public.billing_exceptions (kind, stripe_object_id, detail) values ('refund_unmatched', v_pi, p);
    return jsonb_build_object('unmatched', true);
  end if;
  update public.order_payments
     set refunded_cents = greatest(refunded_cents, coalesce((p ->> 'amount_refunded')::int, 0)),
         state = case when coalesce((p ->> 'amount_refunded')::int, 0) >= amount_cents and amount_cents > 0 then 'refunded' else state end
   where id = v_pay.id;
  select * into v_order from public.orders where id = v_pay.order_id for update;
  if not found then return jsonb_build_object('pending_link', true); end if;

  select coalesce(sum(amount_cents) filter (where state in ('paid', 'refunded')), 0), coalesce(sum(refunded_cents), 0)
    into v_total_paid, v_total_refunded from public.order_payments where order_id = v_order.id;

  if v_total_paid > 0 and v_total_refunded >= v_total_paid then
    update public.orders set status = 'refunded', refunded_cents = v_total_refunded, past_due_since = null where id = v_order.id;
    perform app.revoke_order_entitlements(v_order.id, 'Verified Stripe refund ' || coalesce(p ->> 'charge_id', ''));
    return jsonb_build_object('order_id', v_order.id, 'status', 'refunded', 'stop_schedule', v_order.stripe_subscription_id is not null,
                              'stripe_subscription_id', v_order.stripe_subscription_id);
  end if;

  update public.orders set refunded_cents = v_total_refunded where id = v_order.id;
  insert into public.billing_exceptions (kind, order_id, stripe_object_id, detail)
  values ('partial_refund_review', v_order.id, p ->> 'charge_id', jsonb_build_object('refunded_cents', v_total_refunded, 'paid_cents', v_total_paid));
  return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'partial', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- charge.dispute.created / closed (D07: suspend immediately pending manual review)
-- ---------------------------------------------------------------------------
create or replace function public.billing_apply_dispute(p jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_status text := p ->> 'dispute_status';
begin
  select o.* into v_order from public.orders o
   where o.stripe_payment_intent_id = p ->> 'payment_intent_id'
      or o.id = (select order_id from public.order_payments where stripe_payment_intent_id = p ->> 'payment_intent_id')
   limit 1 for update;
  if not found then
    insert into public.billing_exceptions (kind, stripe_object_id, detail) values ('dispute_unmatched', p ->> 'dispute_id', p);
    return jsonb_build_object('unmatched', true);
  end if;

  if v_status in ('won', 'warning_closed') then
    if v_order.status = 'disputed' then
      update public.orders set status = coalesce(pre_dispute_status, 'paid'), pre_dispute_status = null where id = v_order.id;
    end if;
    perform app.billing_recompute_order(v_order.id);
  elsif v_status = 'lost' then
    update public.orders set status = 'refunded', pre_dispute_status = null where id = v_order.id;
    perform app.revoke_order_entitlements(v_order.id, 'Dispute lost ' || coalesce(p ->> 'dispute_id', ''));
  else
    if v_order.status <> 'disputed' then
      update public.orders set pre_dispute_status = v_order.status, status = 'disputed' where id = v_order.id;
    end if;
  end if;

  insert into public.billing_exceptions (kind, order_id, stripe_object_id, detail)
  values ('dispute_' || coalesce(v_status, 'opened'), v_order.id, p ->> 'dispute_id', p);
  return jsonb_build_object('order_id', v_order.id, 'dispute_status', v_status);
end;
$$;

-- Server only.
do $$
declare f text;
begin
  foreach f in array array[
    'public.billing_record_event(text, text, timestamptz, text)',
    'public.billing_mark_event(text, text, text)',
    'public.billing_apply_checkout(jsonb)',
    'public.billing_apply_invoice(jsonb)',
    'public.billing_link_payment_intent(text, text)',
    'public.billing_apply_subscription(jsonb)',
    'public.billing_apply_refund(jsonb)',
    'public.billing_apply_dispute(jsonb)',
    'app.billing_recompute_order(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- Trialing subscriptions (a graduate or board plan that starts billing when coaching ends) keep access.
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
          and s.status::text in ('active', 'trialing', 'past_due', 'canceled')
          and (s.past_due_since is null or p_at < s.past_due_since + app.grace_period())
        )
      )
  );
$$;
