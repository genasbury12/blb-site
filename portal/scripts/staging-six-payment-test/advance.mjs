// Advance the test clock past the subscription's current period end, then wait for the portal to record it.
import { load, stripe, waitClock, sleep, orderState } from "./lib.mjs";
const s = load();
const sub = await stripe("GET", `/subscriptions/${s.subscriptionId}`);
const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
const before = await orderState(s.userId);
const target = periodEnd + 3 * 3600;
await stripe("POST", `/test_helpers/test_clocks/${s.clockId}/advance`, { frozen_time: target });
const clock = await waitClock(s.clockId);
const invoices = await stripe("GET", `/invoices?subscription=${s.subscriptionId}&limit=10`);
const latest = invoices.data[0];
let after = before;
for (let i = 0; i < 25; i++) { await sleep(4000); after = await orderState(s.userId); if (after.payments.length > before.payments.length || after.order.status !== before.order.status) break; }
await sleep(4000); after = await orderState(s.userId);
const sub2 = await stripe("GET", `/subscriptions/${s.subscriptionId}`);
console.log(JSON.stringify({
  clock_now: new Date(clock.frozen_time * 1000).toISOString().slice(0, 16),
  stripe_invoice: latest ? { status: latest.status, amount: latest.amount_due / 100, billing_reason: latest.billing_reason } : null,
  stripe_invoices_total: invoices.data.length,
  stripe_subscription: sub2.status,
  portal_order: { status: after.order.status, paid: `${after.order.installments_paid} of ${after.order.installments_total}`, past_due_since: after.order.past_due_since },
  portal_payments: after.payments.map((p) => `${p.due ?? "?"} ${p.state} $${p.usd}`),
}, null, 1));
