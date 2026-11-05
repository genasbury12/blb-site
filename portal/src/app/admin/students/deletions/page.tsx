import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/fields";
import { fmtShort } from "@/components/member/time";
import { PageHeader } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { balancesFor, type Balance } from "@/lib/server/data-deletion";
import { getUserEmails } from "@/lib/server/directory";
import { requireStaff } from "@/lib/server/staff";
import { deleteNow } from "../deletion-actions";

export const metadata: Metadata = { title: "Deletion requests" };

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;
type Tab = (typeof TABS)[number]["key"];

type Row = { id: string; user_id: string | null; status: string; outcome: string | null; subject_token: string | null; requested_at: string; due_at: string; cancelled_at: string | null; completed_at: string | null; completed_by: string | null; origin: string; recorded_by: string | null };

const SKU_LABELS: Record<string, string> = { blueprint: "Blueprint", accelerator: "Accelerator", elite: "Elite", graduate_coaching: "Graduate coaching", elite_board: "Elite board" };
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

/** 10_DATA_RIGHTS Slice B. Admins only: coaches never see deletion requests (Slice D). */
export default async function DeletionRequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string; done?: string }> }) {
  const { supabase } = await requireStaff(["admin"], "/admin/students/deletions");
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "pending";
  const statuses = tab === "pending" ? ["pending", "processing"] : [tab];
  const { data, error } = await supabase
    .from("deletion_requests")
    .select("id, user_id, status, outcome, subject_token, requested_at, due_at, cancelled_at, completed_at, completed_by, origin, recorded_by")
    .in("status", statuses)
    .order(tab === "pending" ? "due_at" : "requested_at", { ascending: tab === "pending" })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  const ids = rows.map((r) => r.user_id).filter(Boolean) as string[];
  const [emails, profiles, roles, actors, plans, subs, owed] = await Promise.all([
    getUserEmails(ids),
    ids.length ? supabase.from("profiles").select("user_id, display_name").in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("user_roles").select("user_id").in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("admin_audit_log").select("actor_id").in("actor_id", ids).limit(1000) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("orders").select("user_id").in("user_id", ids).in("status", ["installments_current", "installments_past_due"]) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("subscriptions").select("user_id").in("user_id", ids).in("status", ["active", "past_due", "unpaid"]) : Promise.resolve({ data: [] }),
    tab === "pending" ? balancesFor(ids) : Promise.resolve(new Map<string, Balance[]>()),
  ]);
  const paying = new Set([...(plans.data ?? []), ...(subs.data ?? [])].map((r) => r.user_id as string));
  const nameOf = new Map((profiles.data ?? []).map((p) => [p.user_id as string, (p.display_name as string | null) ?? "Member"]));
  const staff = new Set([...(roles.data ?? []).map((r) => r.user_id as string), ...(actors.data ?? []).map((a) => a.actor_id as string)]);
  const now = new Date().getTime();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Students"
        title="Deletion requests"
        lede="Members ask from My Account. A pending request is deleted automatically 30 days after it was made unless you delete it sooner or the member cancels."
        actions={<Link className="self-center text-sm font-semibold text-plum underline" href="/admin/students">All students</Link>}
      />
      {sp.done === "deleted" ? <Alert tone="success">Deleted. The member&apos;s account and data are gone.</Alert> : null}
      {sp.done === "anonymized" ? <Alert tone="success">This account took admin actions, so it was anonymized and blocked instead of deleted.</Alert> : null}
      <nav aria-label="Request status" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/students/deletions?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), t.key === tab && "border-plum bg-plum text-white hover:bg-plum")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Card tone="quiet"><p className="text-ink-muted">Nothing here.</p></Card>
      ) : tab === "pending" ? (
        <div className="grid gap-4">
          {rows.map((r) => {
            const email = r.user_id ? (emails.get(r.user_id) ?? "") : "";
            const daysLeft = Math.ceil((new Date(r.due_at).getTime() - now) / 864e5);
            return (
              <Card key={r.id} data-testid="deletion-request">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-display text-2xl">{r.user_id ? (nameOf.get(r.user_id) ?? "Member") : "Account already removed"}</h2>
                  <p className="text-sm text-ink-muted">
                    Requested {fmtShort(r.requested_at)}
                    {r.origin !== "member" ? ` (${r.origin === "inactivity" ? "no sign in for 12 months" : "access ended 12 months ago"})` : r.recorded_by ? " (recorded by an admin)" : ""} ·{" "}
                    {r.status === "processing"
                      ? "Deletion started, not finished"
                      : r.user_id && owed.has(r.user_id)
                        ? "Waits for you"
                        : daysLeft > 0
                          ? `Deleted automatically in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                          : "Due now"}
                  </p>
                </div>
                {email ? <p className="mt-1 text-sm">{email}</p> : null}
                {r.user_id && owed.has(r.user_id) ? (
                  <div className="mt-3" data-testid="deletion-balance">
                    <Alert tone="warning" title={`Payments still owed: ${money(owed.get(r.user_id)!.reduce((t, b) => t + b.amountCents, 0))}`}>
                      <ul className="mt-1 list-disc pl-5">
                        {owed.get(r.user_id)!.map((b, i) => (
                          <li key={i}>
                            {b.kind === "installments"
                              ? `${SKU_LABELS[b.sku] ?? b.sku} payment plan: ${b.remainingPayments} payment${b.remainingPayments === 1 ? "" : "s"} left, ${money(b.amountCents)}`
                              : `${SKU_LABELS[b.sku] ?? b.sku} membership: payment past due, ${money(b.amountCents)}`}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2">This request is never carried out automatically. Deleting now also deletes the Stripe customer, which cancels the remaining payments.</p>
                    </Alert>
                  </div>
                ) : r.user_id && paying.has(r.user_id) ? (
                  <div className="mt-3">
                    <Alert tone="warning">This member has a membership in progress. Deleting their Stripe customer cancels it.</Alert>
                  </div>
                ) : null}
                {r.user_id && staff.has(r.user_id) ? (
                  <div className="mt-3">
                    <Alert tone="warning">This account took admin actions and cannot be hard deleted. It will be anonymized and blocked instead.</Alert>
                  </div>
                ) : null}
                <div className="mt-4 border-t border-rose-soft pt-4">
                  <ActionForm action={deleteNow} submitLabel="Delete now" pendingLabel="Deleting" variant="primary">
                    <input type="hidden" name="id" value={r.id} />
                    <label htmlFor={`confirm-${r.id}`} className="block text-sm font-semibold">
                      {r.user_id ? "Type the member's email to confirm" : "Type anything to finish the record"}
                    </label>
                    <input id={`confirm-${r.id}`} name="email" type="text" autoComplete="off" spellCheck={false} className="min-h-11 w-full max-w-md rounded-xl border border-mauve bg-white px-3" />
                  </ActionForm>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable caption={`${tab} deletion requests`} head={tab === "completed" ? ["Anonymous code", "Outcome", "Requested", "Completed", "By"] : ["Member", "Requested", "Cancelled"]}>
          {rows.map((r) =>
            tab === "completed" ? (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs">{r.subject_token}</td>
                <td className="px-4 py-3">{r.outcome === "deleted" ? "Deleted" : "Anonymized and blocked"}</td>
                <td className="px-4 py-3">{fmtShort(r.requested_at)}</td>
                <td className="px-4 py-3">{r.completed_at ? fmtShort(r.completed_at) : ""}</td>
                <td className="px-4 py-3">{r.completed_by === "schedule" ? "Daily job" : "Admin"}</td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.user_id ? (nameOf.get(r.user_id) ?? "Member") : "Account removed"}</td>
                <td className="px-4 py-3">{fmtShort(r.requested_at)}</td>
                <td className="px-4 py-3">{r.cancelled_at ? fmtShort(r.cancelled_at) : ""}</td>
              </tr>
            ),
          )}
        </DataTable>
      )}
    </div>
  );
}
