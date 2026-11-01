import { randomUUID } from "node:crypto";
import { Client, type QueryResultRow } from "pg";
import { inject } from "vitest";

/** Superuser connection (bypasses RLS) used only to arrange fixtures. */
export async function connect(): Promise<Client> {
  const client = new Client({ connectionString: inject("dbUrl") });
  await client.connect();
  return client;
}

export async function createUser(db: Client, label = "student"): Promise<string> {
  const id = randomUUID();
  await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [
    id,
    `${label}-${id.slice(0, 8)}@test.invalid`,
    JSON.stringify({ display_name: `TEST ${label}` }),
  ]);
  return id;
}

export type Q = <R extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]) => Promise<R[]>;

/**
 * Runs `fn` as the given user exactly as Supabase's Data API would: role `authenticated`
 * (or `anon` when userId is null) with request.jwt.claims set. Always rolled back.
 */
export async function asUser<T>(db: Client, userId: string | null, fn: (q: Q) => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    const role = userId ? "authenticated" : "anon";
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify(userId ? { sub: userId, role } : { role }),
    ]);
    const q: Q = async (sql, params) => (await db.query(sql, params as unknown[])).rows;
    return await fn(q);
  } finally {
    await db.query("rollback");
  }
}

/** Expect a statement to be rejected (RLS violation, permission denied, or trigger). */
export async function expectDenied(db: Client, userId: string | null, sql: string, params?: unknown[]) {
  let error: Error | undefined;
  try {
    await asUser(db, userId, (q) => q(sql, params));
  } catch (err) {
    error = err as Error;
  }
  if (!error) throw new Error(`Expected denial but statement succeeded: ${sql}`);
  return error;
}

export async function priceId(db: Client, sku: string, plan: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>("select id from public.prices where sku = $1 and plan = $2", [sku, plan]);
  if (!rows[0]) throw new Error(`no price ${sku}/${plan}`);
  return rows[0].id;
}

/** Arrange a paid order and its grants as the billing processor would. */
export async function paidOrder(
  db: Client,
  userId: string,
  sku: string,
  opts: { plan?: "pay_in_full" | "six_installments"; firstPaidAt?: Date; status?: string; pastDueSince?: Date | null } = {},
): Promise<string> {
  const plan = opts.plan ?? "pay_in_full";
  const pid = await priceId(db, sku, plan);
  const { rows } = await db.query<{ id: string }>(
    `insert into public.orders (user_id, sku, price_id, payment_plan, status, amount_cents, installments_total, installments_paid, first_paid_at, past_due_since)
     select $1, $2, p.id, p.plan, $3::public.order_status, p.amount_cents, p.installment_count, 1, $4, $5
     from public.prices p where p.id = $6 returning id`,
    [userId, sku, opts.status ?? (plan === "pay_in_full" ? "paid" : "installments_current"), opts.firstPaidAt ?? new Date(), opts.pastDueSince ?? null, pid],
  );
  const orderId = rows[0]!.id;
  await db.query("select app.grant_order_entitlements($1)", [orderId]);
  return orderId;
}

export async function hasFeature(db: Client, userId: string, feature: string, at: Date = new Date()): Promise<boolean> {
  const { rows } = await db.query<{ ok: boolean }>("select app.has_feature($1::public.feature_key, $2, $3) as ok", [feature, userId, at]);
  return rows[0]!.ok;
}

export function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + months);
  return x;
}
export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}
