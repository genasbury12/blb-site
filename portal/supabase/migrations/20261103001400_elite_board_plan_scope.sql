-- Migration 1400: Elite Board Retention ($97/month) scope (I-55, owner decision 2026-11-03).
--
-- Owner: the plan is "continued access to new lessons, workshops, and continued access to board. No 1:1 coaching or
-- done for you work." This replaces the earlier rule (CLAUDE.md section 4, ENTITLEMENTS.md) that the board plan
-- never extends the curriculum. Group coaching, community, Hot Seat, feedback, private coaching and DFY hours stay
-- out. Grants follow the paid subscription period like every other subscription feature.

insert into public.product_features (sku, feature_key, window_kind) values
  ('elite_board', 'curriculum.read', 'subscription_period'),
  ('elite_board', 'workshops.access', 'subscription_period')
on conflict do nothing;

-- Re-sync any existing board subscriptions so current subscribers receive the new grants now.
do $$
declare
  v_id uuid;
begin
  for v_id in select id from public.subscriptions where sku = 'elite_board' loop
    perform app.sync_subscription_entitlements(v_id);
  end loop;
end;
$$;
