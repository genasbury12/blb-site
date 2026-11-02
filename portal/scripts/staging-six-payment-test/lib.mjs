// Shared helpers for the six payment lifecycle test. Sandbox key only; never prints secrets.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
export const STATE = new URL("./state.json", import.meta.url).pathname; // local only, gitignored (ids, no secrets)
const KEY = process.env.STAGING_STRIPE_SECRET_KEY;
if (!KEY?.startsWith("sk_test_")) throw new Error("Refusing: STAGING_STRIPE_SECRET_KEY must be a sk_test_ key");
export const SB = process.env.STAGING_SUPABASE_URL, SBK = process.env.STAGING_SUPABASE_SECRET_KEY;
const REF = SB.match(/https:\/\/([^.]+)\./)[1];
export const load = () => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {});
export const save = (s) => writeFileSync(STATE, JSON.stringify(s, null, 2), { mode: 0o600 });
function form(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === "object") form(v, key, out); else out.append(key, String(v));
  }
  return out;
}
export async function stripe(method, path, body) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    method, headers: { Authorization: `Bearer ${KEY}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: body ? form(body) : undefined,
  });
  const j = await r.json();
  if (j.error) throw new Error(`Stripe ${method} ${path}: ${j.error.message}`);
  if (j.livemode) throw new Error("Refusing: livemode object returned");
  return j;
}
export async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`SQL: ${JSON.stringify(j).slice(0, 400)}`);
  return j;
}
export const sbAdmin = (method, path, body) => fetch(`${SB}${path}`, { method, headers: { apikey: SBK, Authorization: `Bearer ${SBK}`, "Content-Type": "application/json", Prefer: "return=representation" }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => { const t = await r.text(); if (!r.ok) throw new Error(`${path}: ${r.status} ${t.slice(0, 300)}`); return t ? JSON.parse(t) : null; });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function waitClock(id) {
  for (let i = 0; i < 60; i++) { const c = await stripe("GET", `/test_helpers/test_clocks/${id}`); if (c.status === "ready") return c; if (c.status === "internal_failure") throw new Error("clock failed"); await sleep(3000); }
  throw new Error("clock not ready");
}
export async function orderState(userId) {
  const [o] = await sql(`select o.id, o.status, o.installments_paid, o.installments_total, o.past_due_since, o.stripe_subscription_id, o.completed_at from public.orders o where o.user_id='${userId}' order by created_at desc limit 1`);
  const pays = await sql(`select state, amount_cents/100 usd, to_char(due_at,'YYYY-MM-DD') due, to_char(paid_at,'YYYY-MM-DD') paid from public.order_payments where order_id='${o?.id}' order by due_at nulls first, created_at`);
  return { order: o, payments: pays };
}
