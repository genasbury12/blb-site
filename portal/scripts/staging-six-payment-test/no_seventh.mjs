import { load, stripe, waitClock, sleep, orderState, sql } from "./lib.mjs";
const s = load();
const clock0 = await stripe("GET", `/test_helpers/test_clocks/${s.clockId}`);
await stripe("POST", `/test_helpers/test_clocks/${s.clockId}/advance`, { frozen_time: clock0.frozen_time + 35 * 86400 });
const clock = await waitClock(s.clockId);
await sleep(8000);
const invoices = await stripe("GET", `/invoices?customer=${s.customerId}&limit=20`);
const charges = await stripe("GET", `/charges?customer=${s.customerId}&limit=20`);
const sub = await stripe("GET", `/subscriptions/${s.subscriptionId}`);
const st = await orderState(s.userId);
const total = invoices.data.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount_paid, 0) / 100;
console.log(JSON.stringify({
  clock_now: new Date(clock.frozen_time * 1000).toISOString().slice(0, 10),
  stripe_subscription: sub.status, canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString().slice(0, 16) : null,
  stripe_invoices: invoices.data.length, stripe_paid_total: total,
  successful_charges: charges.data.filter((c) => c.paid && c.status === "succeeded").length,
  declined_charges: charges.data.filter((c) => c.status === "failed").length,
  portal_order: { status: st.order.status, paid: `${st.order.installments_paid} of 6`, completed_at: st.order.completed_at },
}, null, 1));
const ev = await sql(`select type, outcome, count(*)::int n, sum((error is not null)::int)::int errors from public.billing_events where received_at > now() - interval '3 hours' group by 1,2 order by 1,2`);
console.log("webhooks processed by the portal:", ev.map((e) => `${e.type}=${e.outcome} x${e.n}${e.errors ? ` (${e.errors} errors)` : ""}`).join(", "));
const [a] = await sql(`select app.has_feature('curriculum.read'::public.feature_key, '${s.userId}'::uuid, timestamptz '2027-05-10 00:00+00') ok_may, app.has_feature('curriculum.read'::public.feature_key, '${s.userId}'::uuid, timestamptz '2027-11-03 00:00+00') ok_after_12m`);
console.log("training access in May 2027 (plan finished, inside 12 months):", a.ok_may, "| after 12 months:", a.ok_after_12m);
