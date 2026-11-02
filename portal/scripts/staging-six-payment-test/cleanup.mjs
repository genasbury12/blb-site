import { load, save, stripe, sql, sleep } from "./lib.mjs";
const s = load();
const pending = await sql(`select checkout_session_id from public.orders where user_id='${s.userId}' and status='pending'`);
for (const p of pending) {
  const cs = await stripe("GET", `/checkout/sessions/${p.checkout_session_id}`);
  if (cs.status === "open") await stripe("POST", `/checkout/sessions/${cs.id}/expire`);
}
console.log("unfinished checkout sessions expired:", pending.length);
for (let i = 0; i < 15; i++) { await sleep(4000); const [r] = await sql(`select count(*)::int n from public.orders where user_id='${s.userId}' and status='pending'`); if (r.n === 0) break; }
const rows = await sql(`select status::text, count(*)::int n from public.orders where user_id='${s.userId}' group by 1 order by 1`);
console.log("test member orders now:", rows.map((r) => `${r.status} x${r.n}`).join(", "));
const del = await stripe("DELETE", `/test_helpers/test_clocks/${s.clockId}`);
console.log("test clock deleted (removes its test customer and subscription in Stripe):", del.deleted);
const [e] = await sql(`select count(*)::int n, sum((error is not null)::int)::int errors from public.billing_events where received_at > now() - interval '5 minutes'`);
console.log("webhooks in the last 5 minutes:", e.n, "errors:", e.errors ?? 0);
s.cleaned = true; save(s);
