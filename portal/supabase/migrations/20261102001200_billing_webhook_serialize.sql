-- Migration 1200: serialize installment webhooks per Stripe subscription.
--
-- Found on staging 2026-11-02 (six payment test): Stripe delivered checkout.session.completed and the first
-- invoice.paid in the same second. The two webhook calls ran in parallel transactions; each looked for the
-- other's row before it was committed, so the paid invoice was stored without an order and the order stayed
-- at 0 of 6 paid (member paid, no access). Both functions already link rows that arrive in either order;
-- they only need to take turns. A transaction scoped advisory lock keyed on the subscription id makes the
-- second call wait until the first commits, after which (READ COMMITTED) it sees the first call's rows.
-- Tested by tests/db/billing.test.ts "processed concurrently". Function bodies are otherwise unchanged.

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
  -- Serialize with billing_apply_invoice for the same subscription (see header).
  if p ->> 'subscription_id' is not null then
    perform pg_advisory_xact_lock(hashtextextended('billing:subscription:' || (p ->> 'subscription_id'), 0));
  end if;
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
  -- Serialize with billing_apply_checkout for the same subscription (see header).
  if v_sub is not null then
    perform pg_advisory_xact_lock(hashtextextended('billing:subscription:' || v_sub, 0));
  end if;
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
