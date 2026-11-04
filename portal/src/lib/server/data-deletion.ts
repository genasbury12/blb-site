import "server-only";
import { randomBytes } from "node:crypto";
import Stripe from "stripe";
import { deletionCompleted, retentionDeleted } from "@/domain/email/templates";
import { logEvent } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./email";
import { getStripe } from "./stripe";

/**
 * 10_DATA_RIGHTS Slice B: carry out one deletion request. Used by the admin's "Delete now" (after the route checked
 * the admin and the typed email) and by the daily job (adminId null).
 *
 * Order: note the email, stored files and Stripe customers; delete the Stripe customers (owner decision 2026-11-04;
 * first, so a Stripe failure leaves everything else untouched and the request can simply be retried);
 * erase_member_prepare (database, one transaction, audit logged first);
 * delete the stored files; delete the sign in account, or for staff block it and replace its email; finish; email
 * the member at the address noted at the start, then drop it. If a step after the database part fails, the request
 * stays "processing" and the next run (admin or daily job) repeats it safely.
 * Logs ids of requests and counts only.
 */

type Db = ReturnType<typeof createSupabaseAdminClient>;

export type DeletionOutcome = { requestId: string; outcome: "deleted" | "anonymized"; emailed: boolean };

async function storedFiles(db: Db, userId: string) {
  const [evidence, feedback, boards] = await Promise.all([
    db.from("milestone_progress").select("evidence_storage_key").eq("user_id", userId).not("evidence_storage_key", "is", null),
    db.from("feedback_submissions").select("file_key").eq("user_id", userId).not("file_key", "is", null),
    db.from("elite_boards").select("id").eq("client_id", userId),
  ]);
  const boardIds = (boards.data ?? []).map((b) => b.id as string);
  const elite = boardIds.length ? await db.from("elite_files").select("storage_key").in("board_id", boardIds) : { data: [] };
  return {
    "student-evidence": (evidence.data ?? []).map((r) => r.evidence_storage_key as string),
    "feedback-files": (feedback.data ?? []).map((r) => r.file_key as string),
    "elite-files": (elite.data ?? []).map((r) => r.storage_key as string).filter(Boolean),
  };
}

/** The member's Stripe customers: from their account and from orders under their account or email. */
async function stripeCustomerIds(db: Db, userId: string, email: string | null) {
  const [linked, byUser, byEmail] = await Promise.all([
    db.from("stripe_customers").select("stripe_customer_id").eq("user_id", userId),
    db.from("orders").select("stripe_customer_id").eq("user_id", userId).not("stripe_customer_id", "is", null),
    email ? db.from("orders").select("stripe_customer_id").ilike("email", email).not("stripe_customer_id", "is", null) : Promise.resolve({ data: [] }),
  ]);
  return [...new Set([...(linked.data ?? []), ...(byUser.data ?? []), ...(byEmail.data ?? [])].map((r) => r.stripe_customer_id as string).filter(Boolean))];
}

/**
 * Delete the customers in Stripe. Stripe then cancels any of their subscriptions (so an unfinished payment plan stops)
 * and keeps its own records of past payments, so refunds by payment remain possible. A customer already gone counts
 * as done.
 */
async function deleteStripeCustomers(ids: string[]) {
  if (!ids.length) return 0;
  const stripe = getStripe();
  for (const id of ids) {
    try {
      await stripe.customers.del(id);
    } catch (err) {
      if (err instanceof Stripe.errors.StripeError && (err.code === "resource_missing" || err.statusCode === 404)) continue;
      throw new Error(`Stripe customer not deleted: ${err instanceof Error ? err.message.slice(0, 120) : "unknown"}`);
    }
  }
  return ids.length;
}

export async function executeDeletion(requestId: string, adminId: string | null): Promise<DeletionOutcome> {
  const db = createSupabaseAdminClient();
  const { data: req, error } = await db.from("deletion_requests").select("id, user_id, status, origin").eq("id", requestId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!req || !["pending", "processing"].includes(req.status as string)) throw new Error("This request is not open.");

  const userId = req.user_id as string | null;
  // Account already gone (an earlier run stopped after deleting it): only the bookkeeping is left.
  if (!userId) {
    const { error: fin } = await db.rpc("erase_member_finish", { p_request: requestId, p_admin: adminId });
    if (fin) throw new Error(fin.message);
    return { requestId, outcome: "deleted", emailed: false };
  }

  const [{ data: authUser }, { data: profile }, files] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
    storedFiles(db, userId),
  ]);
  // Kept only in this function, for the confirmation email; never stored.
  const email = authUser.user?.email ?? null;
  const name = (profile?.display_name as string | null) ?? null;

  const stripeCustomers = await deleteStripeCustomers(await stripeCustomerIds(db, userId, email));

  const { data: prepared, error: prepError } = await db.rpc("erase_member_prepare", { p_request: requestId, p_admin: adminId });
  if (prepError) throw new Error(prepError.message);
  const { outcome, token } = prepared as { outcome: "deleted" | "anonymized"; token: string };

  let removed = 0;
  for (const [bucket, keys] of Object.entries(files)) {
    if (!keys.length) continue;
    const { error: rmError } = await db.storage.from(bucket).remove(keys);
    if (rmError) logEvent("warn", "deletion file removal failed", { requestId, bucket });
    else removed += keys.length;
  }

  if (outcome === "deleted") {
    const { error: delError } = await db.auth.admin.deleteUser(userId);
    if (delError) throw new Error(`account not deleted: ${delError.message}`);
  } else {
    // Staff: keep the account the audit log names, but nothing personal and no way in.
    const { error: upError } = await db.auth.admin.updateUserById(userId, {
      email: `${token}@deleted.invalid`,
      email_confirm: true,
      password: randomBytes(24).toString("base64url"),
      user_metadata: {},
      ban_duration: "876000h",
    });
    if (upError) throw new Error(`account not anonymized: ${upError.message}`);
  }

  const { error: finError } = await db.rpc("erase_member_finish", { p_request: requestId, p_admin: adminId });
  if (finError) throw new Error(finError.message);

  const template =
    req.origin === "retention" ? retentionDeleted({ name, basis: "access_ended" }) : req.origin === "inactivity" ? retentionDeleted({ name, basis: "inactive" }) : deletionCompleted({ name });
  const emailed = email ? (await sendEmail(email, template)) === "sent" : false;
  logEvent("info", "deletion completed", { requestId, outcome, files: removed, stripeCustomers, via: adminId ? "admin" : "schedule" });
  return { requestId, outcome, emailed };
}

/**
 * Requests the daily job runs: pending past their 30 day due date, or stuck in processing for over an hour. Never a
 * request from a member who still owes a balance (owner decision 2026-11-04): those wait for an admin.
 */
export async function dueDeletionRequests(now = new Date()): Promise<string[]> {
  const db = createSupabaseAdminClient();
  const [due, stuck] = await Promise.all([
    db.from("deletion_requests").select("id, user_id").eq("status", "pending").lte("due_at", now.toISOString()).order("due_at"),
    db.from("deletion_requests").select("id, user_id").eq("status", "processing").lte("processing_started_at", new Date(now.getTime() - 3600e3).toISOString()),
  ]);
  if (due.error) throw new Error(due.error.message);
  if (stuck.error) throw new Error(stuck.error.message);
  const rows = [...(due.data ?? []), ...(stuck.data ?? [])];
  const owing = await usersOwing(rows.map((r) => r.user_id as string).filter(Boolean));
  return rows.filter((r) => !owing.has(r.user_id as string)).map((r) => r.id as string);
}

export type Balance = { kind: "installments" | "membership_past_due"; sku: string; remainingPayments: number; amountCents: number };

/** What each member still owes (plan payments left, membership payments past due). Server use. */
export async function balancesFor(userIds: string[]): Promise<Map<string, Balance[]>> {
  const out = new Map<string, Balance[]>();
  if (!userIds.length) return out;
  const { data, error } = await createSupabaseAdminClient().rpc("deletion_balances", { p_users: userIds });
  if (error) throw new Error(error.message);
  for (const r of (data ?? []) as { user_id: string; kind: Balance["kind"]; sku: string; remaining_payments: number; amount_cents: number | string }[]) {
    out.set(r.user_id, [...(out.get(r.user_id) ?? []), { kind: r.kind, sku: r.sku, remainingPayments: r.remaining_payments, amountCents: Number(r.amount_cents) }]);
  }
  return out;
}

async function usersOwing(userIds: string[]) {
  return new Set((await balancesFor(userIds)).keys());
}
