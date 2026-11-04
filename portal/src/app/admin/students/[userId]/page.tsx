import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { assignStudentCoach, grantAccess, setCoachRole, setGrantState } from "@/app/admin/students/actions";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable, Field, Select, TextInput } from "@/components/admin/fields";
import { fmtDay, fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, Stat } from "@/components/ui/card";
import { PATH_LABELS } from "@/domain/audit/labels";
import { FEATURE_KEYS } from "@/lib/features";
import { getUserEmail } from "@/lib/server/directory";
import { requireStaff } from "@/lib/server/staff";
import { DataExportButton } from "@/components/member/data-export-button";

export const metadata: Metadata = { title: "Student" };

export default async function StudentPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], `/admin/students/${userId}`);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) notFound();
  const [profile, grants, orders, subs, runs, progress, roles, assignments, coaches] = await Promise.all([
    supabase.from("profiles").select("display_name, onboarding_state, created_at").eq("user_id", userId).maybeSingle(),
    supabase.from("entitlements").select("id, feature_key, source_type, starts_at, ends_at, state, manual_override_reason").eq("user_id", userId).order("feature_key"),
    supabase.from("orders").select("id, sku, payment_plan, status, installments_paid, installments_total, first_paid_at").eq("user_id", userId),
    supabase.from("subscriptions").select("id, sku, status, current_period_end, cancel_at_period_end").eq("user_id", userId),
    supabase.from("audit_runs").select("id, submitted_at, overall_score, assigned_path").eq("user_id", userId).order("submitted_at", { ascending: false }),
    supabase.from("lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("coach_assignments").select("coach_id").eq("student_id", userId),
    isAdmin ? supabase.from("user_roles").select("user_id").eq("role", "coach") : Promise.resolve({ data: [] }),
  ]);
  if (!profile.data) notFound();
  const email = isAdmin ? await getUserEmail(userId) : null;
  const roleList = (roles.data ?? []).map((r) => r.role as string);
  const coachIds = (coaches.data ?? []).map((c) => c.user_id as string);
  const assignedIds = (assignments.data ?? []).map((a) => a.coach_id as string);
  const { data: coachNames } = coachIds.length || assignedIds.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", [...coachIds, ...assignedIds]) : { data: [] };
  const coachName = new Map((coachNames ?? []).map((c) => [c.user_id as string, (c.display_name as string) ?? "Coach"]));
  const now = new Date();

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Student" title={(profile.data.display_name as string) ?? "Member"} lede={`${email ?? ""}${roleList.length ? ` · Roles: ${roleList.join(", ")}` : ""}`} actions={<Link className="self-center text-sm font-semibold text-plum underline" href="/admin/students">All students</Link>} />
      {isAdmin ? (
        <Card>
          <CardTitle className="text-xl">Member data</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">Everything the portal stores about this member, with their worksheet and audit PDFs and their uploads. This admin copy also includes notes staff keep for themselves, which the member's own download leaves out. Admins only. Each export is recorded in the audit log.</p>
          <div className="mt-4">
            <DataExportButton endpoint={`/api/admin/members/${userId}/export`} label="Export data" variant="secondary" />
          </div>
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><Stat label="Lessons completed" value={String(progress.count ?? 0)} /></Card>
        <Card><Stat label="Audits taken" value={String(runs.data?.length ?? 0)} hint={runs.data?.[0] ? `Latest ${Math.round(Number(runs.data[0].overall_score))}%, ${PATH_LABELS[runs.data[0].assigned_path as keyof typeof PATH_LABELS]}` : undefined} /></Card>
        <Card><Stat label="Joined" value={fmtDay(profile.data.created_at as string)} /></Card>
      </div>

      <section aria-labelledby="access">
        <SectionTitle id="access">Access</SectionTitle>
        <DataTable caption="Entitlements" head={["Feature", "Source", "Window", "State", ""]}>
          {(grants.data ?? []).map((g) => {
            const inWindow = new Date(g.starts_at as string) <= now && (!g.ends_at || new Date(g.ends_at as string) > now);
            return (
              <tr key={g.id as string}>
                <td className="px-4 py-3">{g.feature_key as string}</td>
                <td className="px-4 py-3">{g.source_type === "admin_override" ? `Admin: ${g.manual_override_reason}` : (g.source_type as string)}</td>
                <td className="px-4 py-3">{fmtDay(g.starts_at as string)} to {g.ends_at ? fmtDay(g.ends_at as string) : "ongoing"}{inWindow ? "" : " (outside window)"}</td>
                <td className="px-4 py-3"><Badge tone={g.state === "active" ? "plum" : "neutral"}>{g.state as string}</Badge></td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <details><summary className="cursor-pointer text-plum">Change</summary>
                      <ActionForm action={setGrantState} submitLabel="Apply" variant="secondary" className="mt-2 grid gap-2">
                        <input type="hidden" name="id" value={g.id as string} /><input type="hidden" name="user_id" value={userId} />
                        <Select name="state" defaultValue={g.state as string} aria-label="New state"><option value="active">Active</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option></Select>
                        <TextInput name="reason" required placeholder="Reason" aria-label="Reason" />
                      </ActionForm>
                    </details>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </DataTable>
        {isAdmin ? (
          <Card className="mt-4">
            <h3 className="font-display text-xl">Grant access manually</h3>
            <p className="text-sm text-ink-muted">For comps, corrections and support. Every grant needs a reason and is logged.</p>
            <ActionForm action={grantAccess} submitLabel="Grant access" variant="secondary" className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_1.4fr_auto] sm:items-end">
              <input type="hidden" name="user_id" value={userId} />
              <Field label="Feature" htmlFor="ga-f"><Select id="ga-f" name="feature">{FEATURE_KEYS.map((f) => <option key={f} value={f}>{f}</option>)}</Select></Field>
              <Field label="Ends (optional)" htmlFor="ga-e"><TextInput id="ga-e" name="ends_on" type="date" /></Field>
              <Field label="Reason" htmlFor="ga-r"><TextInput id="ga-r" name="reason" required minLength={5} /></Field>
            </ActionForm>
          </Card>
        ) : null}
      </section>

      <section aria-labelledby="purchases" className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 id="purchases" className="font-display text-2xl">Purchases</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(orders.data ?? []).map((o) => <li key={o.id as string} className="capitalize">{o.sku as string}, {String(o.payment_plan).replaceAll("_", " ")}: {String(o.status).replaceAll("_", " ")} ({o.installments_paid as number} of {o.installments_total as number}){o.first_paid_at ? `, since ${fmtDay(o.first_paid_at as string)}` : ""}</li>)}
            {(subs.data ?? []).map((s) => <li key={s.id as string} className="capitalize">{String(s.sku).replace("_", " ")}: {s.status as string}, {s.cancel_at_period_end ? "ends" : "renews"} {fmtDay(s.current_period_end as string)}</li>)}
          </ul>
          {!(orders.data ?? []).length && !(subs.data ?? []).length ? <p className="mt-2 text-sm text-ink-muted">No purchases.</p> : null}
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Audit history</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(runs.data ?? []).map((r) => <li key={r.id as string}>{fmtShort(r.submitted_at as string)}: {Math.round(Number(r.overall_score))}%, {PATH_LABELS[r.assigned_path as keyof typeof PATH_LABELS]}</li>)}
          </ul>
          {!(runs.data ?? []).length ? <p className="mt-2 text-sm text-ink-muted">No audits yet.</p> : null}
        </Card>
      </section>

      {isAdmin ? (
        <section aria-labelledby="coaching" className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 id="coaching" className="font-display text-2xl">Assigned coaches</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {assignedIds.map((c) => (
                <li key={c} className="flex items-center justify-between gap-2">{coachName.get(c) ?? "Coach"}
                  <ActionForm action={assignStudentCoach} submitLabel="Remove" variant="quiet"><input type="hidden" name="student_id" value={userId} /><input type="hidden" name="coach_id" value={c} /><input type="hidden" name="remove" value="true" /></ActionForm>
                </li>
              ))}
            </ul>
            {coachIds.length ? (
              <ActionForm action={assignStudentCoach} submitLabel="Assign" variant="secondary" className="mt-3 flex flex-wrap items-end gap-3">
                <input type="hidden" name="student_id" value={userId} />
                <Field label="Coach" htmlFor="ac-c"><Select id="ac-c" name="coach_id">{coachIds.map((c) => <option key={c} value={c}>{coachName.get(c) ?? "Coach"}</option>)}</Select></Field>
              </ActionForm>
            ) : <p className="mt-2 text-sm text-ink-muted">No coaches yet. Give someone the coach role first.</p>}
          </Card>
          <Card>
            <h2 className="font-display text-2xl">Coach role</h2>
            <p className="mt-1 text-sm text-ink-muted">Coaches can run sessions, respond to feedback, moderate, and see members assigned to them. The admin role is granted only by the setup script.</p>
            <ActionForm action={setCoachRole} submitLabel={roleList.includes("coach") ? "Remove coach role" : "Make this person a coach"} variant="secondary" className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="user_id" value={userId} /><input type="hidden" name="enabled" value={roleList.includes("coach") ? "false" : "true"} />
              <Field label="Reason" htmlFor="cr-r"><TextInput id="cr-r" name="reason" required minLength={5} /></Field>
            </ActionForm>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
