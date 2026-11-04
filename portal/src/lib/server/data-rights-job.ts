import "server-only";
import { planRetention, RETENTION, type RetentionFact } from "@/domain/data-rights/retention";
import { retentionReminder } from "@/domain/email/templates";
import { publicEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dueDeletionRequests, executeDeletion } from "./data-deletion";
import { sendEmail } from "./email";

/**
 * 10_DATA_RIGHTS daily job (Slices B and C), run by Vercel Cron through /api/cron/data-rights:
 *   1. reminders 30 and 7 days before a lapsed member's account is deleted;
 *   2. lapsed members past 12 months: a deletion request (origin "retention") carried out at once;
 *   3. members' own requests past their 30 days, and any deletion left half done;
 *   4. anonymized purchase records older than 7 years removed.
 * Each run is recorded in job_runs with counts only.
 */

export const DATA_RIGHTS_JOB = "data_rights";

export type JobSummary = {
  remindersSent: number;
  reminderFailures: number;
  retentionDeleted: number;
  requestsDeleted: number;
  anonymized: number;
  purchaseRecordsRemoved: number;
  failures: number;
};

const day = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

export async function runDataRightsJob(now = new Date()): Promise<JobSummary & { status: "ok" | "failed" }> {
  const db = createSupabaseAdminClient();
  const { data: run, error: runError } = await db.from("job_runs").insert({ job: DATA_RIGHTS_JOB, started_at: now.toISOString() }).select("id").single();
  if (runError) throw new Error(runError.message);
  const s: JobSummary = { remindersSent: 0, reminderFailures: 0, retentionDeleted: 0, requestsDeleted: 0, anonymized: 0, purchaseRecordsRemoved: 0, failures: 0 };
  const fail = (step: string, err: unknown) => {
    s.failures += 1;
    logEvent("error", "data rights job step failed", { step, message: err instanceof Error ? err.message.slice(0, 200) : "unknown" });
  };

  // 1 and 2: retention.
  try {
    const { data, error } = await db.rpc("retention_facts", { p_at: now.toISOString() });
    if (error) throw new Error(error.message);
    const facts: RetentionFact[] = ((data ?? []) as { user_id: string; access_ended_at: string; is_staff: boolean; has_open_request: boolean; notices: string[] }[]).map((r) => ({
      userId: r.user_id,
      accessEndedAt: new Date(r.access_ended_at),
      isStaff: r.is_staff,
      hasOpenRequest: r.has_open_request,
      notices: r.notices ?? [],
    }));
    for (const a of planRetention(facts, now)) {
      try {
        if (a.action === "remind") {
          const [{ data: u }, { data: profile }] = await Promise.all([
            db.auth.admin.getUserById(a.userId),
            db.from("profiles").select("display_name").eq("user_id", a.userId).maybeSingle(),
          ]);
          const email = u.user?.email;
          const result = email
            ? await sendEmail(email, retentionReminder({
                name: (profile?.display_name as string | null) ?? null,
                endedOn: day.format(a.accessEndedAt),
                deleteOn: day.format(a.deleteOn),
                daysLeft: a.kind === "7_days" ? 7 : 30,
                url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/app/account#your-data`,
              }))
            : "failed";
          // A failed send is retried tomorrow; "suppressed" (test environments) counts as handled.
          if (result === "failed") {
            s.reminderFailures += 1;
            continue;
          }
          const { error: nErr } = await db.from("retention_notices").insert({ user_id: a.userId, kind: a.kind, access_ended_at: a.accessEndedAt.toISOString() });
          if (nErr && nErr.code !== "23505") throw new Error(nErr.message);
          s.remindersSent += 1;
        } else {
          const { data: req, error: rErr } = await db.from("deletion_requests").insert({ user_id: a.userId, origin: "retention", due_at: now.toISOString() }).select("id").single();
          if (rErr) throw new Error(rErr.message);
          const r = await executeDeletion(req.id as string, null);
          if (r.outcome === "anonymized") s.anonymized += 1;
          else s.retentionDeleted += 1;
        }
      } catch (err) {
        fail(a.action, err);
      }
    }
  } catch (err) {
    fail("retention", err);
  }

  // 3: members' own requests past 30 days (and anything left half done).
  try {
    for (const id of await dueDeletionRequests(now)) {
      try {
        const r = await executeDeletion(id, null);
        if (r.outcome === "anonymized") s.anonymized += 1;
        else s.requestsDeleted += 1;
      } catch (err) {
        fail("request", err);
      }
    }
  } catch (err) {
    fail("requests", err);
  }

  // 4: purchase records past their retention.
  try {
    const { data, error } = await db.rpc("purge_expired_purchase_records", { p_years: RETENTION.purchaseRecordYears, p_at: now.toISOString() });
    if (error) throw new Error(error.message);
    s.purchaseRecordsRemoved = Number(data ?? 0);
  } catch (err) {
    fail("purchase records", err);
  }

  const status = s.failures || s.reminderFailures ? "failed" : "ok";
  await db.from("job_runs").update({ finished_at: new Date().toISOString(), status, summary: s }).eq("id", run.id);
  logEvent("info", "data rights job ran", { ...s, status });
  return { ...s, status };
}
