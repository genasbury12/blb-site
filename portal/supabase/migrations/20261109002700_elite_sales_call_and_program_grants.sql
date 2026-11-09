-- The BOSS Business System
-- Migration 2700: Elite from a sales call, and programs granted by hand (owner request 2026-11-09).
--
-- 1. public.admin_accept_elite_from_call: after a sales call the client does not apply. An admin enters her name and
--    email; she is accepted at once (same 14 day window and five seat cap as an accepted application), so Elite
--    checkout opens for her account. If she already has an open application, that one is accepted instead.
-- 2. public.admin_grant_program: when payment is collected outside the portal, an admin grants the whole program in
--    one step: every feature the program includes, with the same dates a purchase would give (12 months of course,
--    6 months of coaching, Elite hours for 6 months and 30 days), as admin overrides with the written reason.
-- 3. Elite granted by hand gets what a purchase gets: the private board, the 12 included hours, and her accepted
--    application marked enrolled (app.on_elite_grant now also runs for admin overrides).
-- Every step is written to the audit log. Safe to run where it already exists.

create or replace function public.admin_accept_elite_from_call(p_name text, p_email text, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_name, ''));
  v_user uuid;
  v_id uuid;
begin
  if not app.is_admin() then
    raise exception 'admin role required' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if char_length(v_name) < 2 then
    raise exception 'Enter her name' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('elite-seats', 0));
  if exists (select 1 from public.elite_applications a where a.email = v_email and a.status = 'accepted' and a.accepted_until > now()) then
    raise exception 'She is already accepted. Send her the checkout link.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.entitlements e join auth.users u on u.id = e.user_id
     where lower(u.email) = v_email and e.feature_key = 'elite_coaching.access' and app.has_feature('elite_coaching.access', e.user_id, now())
  ) then
    raise exception 'She already has Elite.' using errcode = '23505';
  end if;
  if app.elite_seats_used() >= 5 then
    raise exception 'All five Elite seats are taken. Decline or wait for a seat to open.' using errcode = '23514';
  end if;
  select u.id into v_user from auth.users u where lower(u.email) = v_email limit 1;

  -- An open application from her: accept that one.
  select a.id into v_id from public.elite_applications a
   where a.email = v_email and a.status in ('submitted', 'reviewing', 'discovery_scheduled')
   order by a.created_at desc limit 1;
  if v_id is not null then
    update public.elite_applications
       set status = 'accepted', accepted_until = now() + interval '14 days', decided_by = auth.uid(), decided_at = now(),
           decision_note = coalesce(nullif(trim(p_note), ''), 'Accepted after a sales call.'), user_id = coalesce(user_id, v_user)
     where id = v_id;
  else
    insert into public.elite_applications (user_id, name, email, business_stage, goals, biggest_challenge, status, accepted_until, decided_by, decided_at, decision_note)
    values (v_user, v_name, v_email, 'Sales call', 'Discussed on a sales call.', 'Discussed on a sales call.', 'accepted', now() + interval '14 days',
            auth.uid(), now(), coalesce(nullif(trim(p_note), ''), 'Accepted after a sales call.'))
    returning id into v_id;
  end if;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason)
  values (auth.uid(), 'elite_applications.accept_from_call', 'elite_applications', v_id::text,
          jsonb_build_object('name', v_name, 'email', v_email, 'accepted_until', now() + interval '14 days', 'account_found', v_user is not null),
          nullif(trim(p_note), ''));
  return v_id;
end;
$$;

revoke execute on function public.admin_accept_elite_from_call(text, text, text) from public, anon;
grant execute on function public.admin_accept_elite_from_call(text, text, text) to authenticated;

create or replace function public.admin_grant_program(p_user uuid, p_sku text, p_reason text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_now timestamptz := now();
  v_count int := 0;
  r record;
begin
  if not app.is_admin() then
    raise exception 'admin role required' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'a reason of at least 5 characters is required';
  end if;
  if p_sku not in ('blueprint', 'accelerator', 'elite') then
    raise exception 'Choose Blueprint, Accelerator or Elite' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users where id = p_user) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  select * into v_product from public.products where sku = p_sku;
  for r in
    select pf.feature_key,
           case pf.window_kind
             when 'curriculum' then v_now + make_interval(months => v_product.curriculum_months)
             when 'coaching' then v_now + make_interval(months => v_product.coaching_months)
             when 'coaching_plus_dfy_extension' then v_now + make_interval(months => v_product.coaching_months)
               + make_interval(days => coalesce(v_product.dfy_extension_days, 0))
             else null
           end as ends_at
      from public.product_features pf
     where pf.sku = p_sku and pf.window_kind <> 'subscription_period'
     -- Elite last, so its board is made once every other grant is in place.
     order by pf.feature_key = 'elite_dfu_hours.use', pf.feature_key
  loop
    perform public.admin_grant_entitlement(p_user, r.feature_key, v_now, r.ends_at, trim(p_reason) || ' (' || p_sku || ' program)');
    v_count := v_count + 1;
  end loop;
  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, changed_fields, reason)
  values (auth.uid(), 'entitlement.grant_program', 'profile', p_user::text, jsonb_build_object('sku', p_sku, 'features', v_count), trim(p_reason));
  return v_count;
end;
$$;

revoke execute on function public.admin_grant_program(uuid, text, text) from public, anon;
grant execute on function public.admin_grant_program(uuid, text, text) to authenticated;

-- Elite granted by hand (admin override) gets its board and 12 included hours too, like a purchase.
create or replace function app.on_elite_grant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_board uuid;
begin
  if new.feature_key = 'elite_dfu_hours.use' and new.source_type in ('order', 'admin_override') then
    insert into public.elite_boards (client_id) values (new.user_id) on conflict (client_id) do nothing;
    select id into v_board from public.elite_boards where client_id = new.user_id;
    insert into public.elite_hour_buckets (board_id, kind, minutes_granted, starts_at, expires_at, note)
    values (v_board, 'included', 720, new.starts_at, coalesce(new.ends_at, new.starts_at + interval '7 months'), 'Included 12 hours')
    on conflict (board_id) where kind = 'included' do nothing;
    update public.elite_applications set status = 'enrolled'
     where status = 'accepted' and (user_id = new.user_id or email = (select lower(email) from auth.users where id = new.user_id));
  end if;
  return new;
end;
$$;
