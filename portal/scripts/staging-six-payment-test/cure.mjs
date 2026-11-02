import { load, stripe, sleep, orderState, sql } from "./lib.mjs";
const s = load();
const ends = async () => (await sql(`select feature_key::text f, to_char(ends_at,'YYYY-MM-DD HH24:MI') e from public.entitlements where user_id='${s.userId}' order by 1`)).map((r) => `${r.f} until ${r.e}`);
const endsBefore = await ends();
const open = (await stripe("GET", `/invoices?subscription=${s.subscriptionId}&status=open&limit=5`)).data[0];
const paid = await stripe("POST", `/invoices/${open.id}/pay`, { payment_method: s.currentPm });
console.log("overdue invoice paid in Stripe:", paid.status, `$${paid.amount_paid / 100}`);
let st; for (let i = 0; i < 20; i++) { await sleep(4000); st = await orderState(s.userId); if (st.order.status === "installments_current") break; }
await sleep(3000); st = await orderState(s.userId);
const sub = await stripe("GET", `/subscriptions/${s.subscriptionId}`);
console.log(JSON.stringify({ stripe_subscription: sub.status, portal_order: { status: st.order.status, paid: `${st.order.installments_paid} of 6`, past_due_since: st.order.past_due_since }, payments: st.payments.map((p) => `${p.due} ${p.state}`) }, null, 1));
const endsAfter = await ends();
console.log("access end dates unchanged by the cure:", JSON.stringify(endsBefore) === JSON.stringify(endsAfter), "|", endsAfter.join("; "));
const [g] = await sql(`select app.has_feature('curriculum.read'::public.feature_key, '${s.userId}'::uuid, timestamptz '2027-01-10 23:16+00') ok`);
console.log("access 8 days after the original failure, now that it is paid:", g.ok);
