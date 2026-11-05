import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/admin/fields";
import { fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Card, Stat } from "@/components/ui/card";
import { planRetention, RETENTION, retentionDeletionDate } from "@/domain/data-rights/retention";
import { balancesFor } from "@/lib/server/data-deletion";
import { DATA_RIGHTS_JOB, type JobSummary } from "@/lib/server/data-rights-job";
import { requireStaff } from "@/lib/server/staff";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Data settings" };

type Run = { id: string; started_at: string; finished_at: string | null; status: string; summary: Partial<JobSummary> };

/** 10_DATA_RIGHTS Slice C: retention rules, what is pending, and the daily job's health. Admins only. */
export default async function DataSettingsPage() {
  const { supabase } = await requireStaff(["admin"], "/admin/settings/data");
  const now = new Date();
  const [runs, pending, facts] = await Promise.all([
    supabase.from("job_runs").select("id, started_at, finished_at, status, summary").eq("job", DATA_RIGHTS_JOB).order("started_at", { ascending: false }).limit(30),
    supabase.from("deletion_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
    // Server only function; this page is admin only and shows counts, never names.
    createSupabaseAdminClient().rpc("retention_facts", { p_at: now.toISOString() }),
  ]);
  const list = (runs.data ?? []) as Run[];
  const last = list[0];
  const kept = ((facts.data ?? []) as { user_id: string; basis: "access_ended" | "inactive"; since: string; is_staff: boolean; has_open_request: boolean; held: boolean; notices: string[] }[])
    .filter((f) => !f.is_staff && !f.has_open_request)
    .map((f) => ({ userId: f.user_id, basis: f.basis, since: new Date(f.since), isStaff: false, hasOpenRequest: false, held: f.held, notices: f.notices ?? [] }));
  const lapsed = kept.filter((f) => f.basis === "access_ended");
  const inactive = kept.filter((f) => f.basis === "inactive");
  const soon = kept.filter((f) => !f.held && retentionDeletionDate(f.since, f.basis).getTime() - now.getTime() <= RETENTION.deletionWindowDays * 864e5).length;
  const dueToday = planRetention(kept, now).filter((a) => a.action === "delete" && !a.held).length;
  const held = (await createSupabaseAdminClient().from("deletion_requests").select("user_id").in("status", ["pending", "processing"])).data ?? [];
  const owing = held.length ? await balancesFor(held.map((r) => r.user_id as string).filter(Boolean)) : new Map();
  const stale = !last || now.getTime() - new Date(last.started_at).getTime() > 36 * 3600e3;

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Settings" title="Member data" lede="How long member data is kept, what is waiting, and whether the daily job is running." />

      {stale ? (
        <Alert tone="warning" title="The daily job has not run in the last day">
          It runs each morning on the live site once CRON_SECRET is set in Vercel (Production). Until it runs, reminders are not sent and due deletions wait.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Deletion requests waiting" value={String(pending.count ?? 0)} hint={owing.size ? `${owing.size} need you: payments still owed` : undefined} /></Card>
        <Card><Stat label="Lapsed members kept" value={String(lapsed.length)} hint={`Access ended, within 12 months. Plus ${inactive.length} account${inactive.length === 1 ? "" : "s"} with no purchase.`} /></Card>
        <Card><Stat label="Deleted within 30 days" value={String(soon)} hint={dueToday ? `${dueToday} due at the next run` : undefined} /></Card>
        <Card><Stat label="Last run" value={last ? fmtShort(last.started_at) : "Never"} hint={last ? (last.status === "ok" ? "Finished without problems" : last.status === "running" ? "Still running" : "Had a problem, see below") : undefined} /></Card>
      </div>

      <section aria-labelledby="rules">
        <SectionTitle id="rules">Retention rules</SectionTitle>
        <Card>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li><strong>Active members:</strong> everything is kept while they have access.</li>
            <li><strong>After access ends:</strong> data and the &quot;Download all my data&quot; button stay for {RETENTION.lapsedRetentionMonths} months. Reminder emails go {RETENTION.reminderDays.join(" and ")} days before; then the account is deleted the same way as a member&apos;s own request.</li>
            <li><strong>Accounts with no purchase:</strong> deleted {RETENTION.inactiveAccountMonths} months after the last sign in, with the same reminders.</li>
            <li><strong>Deletion requests:</strong> carried out within {RETENTION.deletionWindowDays} days, sooner if you use Delete now.</li>
            <li><strong>Payments still owed:</strong> if a member has a payment plan with payments left, or a membership payment past due, their deletion is never carried out automatically. It waits on Deletion requests, with the balance shown, for you to decide.</li>
            <li><strong>Purchase records:</strong> kept {RETENTION.purchaseRecordYears} years for tax and refunds, with the member&apos;s name and email replaced by an anonymous code, then removed.</li>
            <li><strong>Audit log:</strong> kept indefinitely; deleted members appear only as an anonymous code.</li>
            <li><strong>Staff accounts</strong> are never deleted by these rules; on request they are anonymized and blocked.</li>
          </ul>
          <p className="mt-4 text-sm text-ink-muted">
            Requests are on <Link className="text-plum underline" href="/admin/students/deletions">Students &amp; access, Deletion requests</Link>.
          </p>
        </Card>
      </section>

      <section aria-labelledby="runs">
        <SectionTitle id="runs">Last {list.length || 30} runs</SectionTitle>
        {list.length === 0 ? (
          <Card tone="quiet"><p className="text-ink-muted">No runs yet.</p></Card>
        ) : (
          <DataTable caption="Daily data job runs" head={["Started", "Result", "Reminders", "Deleted after 12 months", "Deleted on request", "Anonymized staff", "Waiting for you", "Purchase records removed", "Problems"]}>
            {list.map((r) => (
              <tr key={r.id} data-testid="job-run">
                <td className="px-4 py-3 whitespace-nowrap">{fmtShort(r.started_at)}</td>
                <td className="px-4 py-3">{r.status === "ok" ? "OK" : r.status === "running" ? "Running" : "Problem"}</td>
                <td className="px-4 py-3">{r.summary.remindersSent ?? 0}</td>
                <td className="px-4 py-3">{r.summary.retentionDeleted ?? 0}</td>
                <td className="px-4 py-3">{r.summary.requestsDeleted ?? 0}</td>
                <td className="px-4 py-3">{r.summary.anonymized ?? 0}</td>
                <td className="px-4 py-3">{r.summary.heldForAdmin ?? 0}</td>
                <td className="px-4 py-3">{r.summary.purchaseRecordsRemoved ?? 0}</td>
                <td className="px-4 py-3">{(r.summary.failures ?? 0) + (r.summary.reminderFailures ?? 0)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </div>
  );
}
