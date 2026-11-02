import type { Metadata } from "next";
import { createHotSeatSession, decideHotSeat, generateWeeklySessions, saveHoliday, saveSession, setSessionStatus } from "@/app/admin/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/admin/fields";
import { fmtDateTime, fmtMonth } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, Eyebrow } from "@/components/ui/card";
import { hotSeatTarget, utcToEasternWall } from "@/domain/schedule/calendar";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Coaching" };

type S = { id: string; kind: string; title: string; agenda: string | null; starts_at: string; ends_at: string; meeting_url_private: string | null; recording_url_private: string | null; status: string; published: boolean };

function SessionFields({ s }: { s?: S }) {
  const minutes = s ? Math.round((new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60000) : 60;
  return (
    <div className="grid gap-4">
      <input type="hidden" name="id" value={s?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" htmlFor={`k-${s?.id ?? "new"}`}>
          <Select id={`k-${s?.id ?? "new"}`} name="kind" defaultValue={s?.kind ?? "group"}><option value="group">Group coaching</option><option value="hot_seat">Hot Seat</option></Select>
        </Field>
        <Field label="Starts (Eastern time)" htmlFor={`st-${s?.id ?? "new"}`}><TextInput id={`st-${s?.id ?? "new"}`} name="starts_at" type="datetime-local" required defaultValue={s ? utcToEasternWall(new Date(s.starts_at)) : ""} /></Field>
        <Field label="Minutes" htmlFor={`d-${s?.id ?? "new"}`}><TextInput id={`d-${s?.id ?? "new"}`} name="duration" type="number" min={15} max={240} defaultValue={minutes} /></Field>
      </div>
      <Field label="Title" htmlFor={`t-${s?.id ?? "new"}`}><TextInput id={`t-${s?.id ?? "new"}`} name="title" required defaultValue={s?.title ?? "Weekly group coaching"} /></Field>
      <Field label="Agenda (members see this)" htmlFor={`a-${s?.id ?? "new"}`}><TextArea id={`a-${s?.id ?? "new"}`} name="agenda" defaultValue={s?.agenda ?? ""} className="min-h-20" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Private join link (https)" hint="Visible only to members with coaching access. No passwords in this field." htmlFor={`m-${s?.id ?? "new"}`}><TextInput id={`m-${s?.id ?? "new"}`} name="meeting_url_private" type="url" defaultValue={s?.meeting_url_private ?? ""} /></Field>
        <Field label="Replay link (https)" htmlFor={`r-${s?.id ?? "new"}`}><TextInput id={`r-${s?.id ?? "new"}`} name="recording_url_private" type="url" defaultValue={s?.recording_url_private ?? ""} /></Field>
      </div>
      <Checkbox name="published" label="Published to members" defaultChecked={s?.published ?? false} />
    </div>
  );
}

export default async function AdminCoachingPage() {
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], "/admin/coaching");
  const now = new Date();
  const target = hotSeatTarget(now);
  const [sessions, apps, holidays, questions] = await Promise.all([
    supabase.from("coaching_sessions").select("*").gte("ends_at", new Date(now.getTime() - 14 * 86400000).toISOString()).order("starts_at").limit(30),
    supabase.from("hotseat_applications").select("id, user_id, target_month, topic, details, redaction_requests, status, created_at").neq("status", "withdrawn").gte("target_month", target.targetMonth.slice(0, 7) + "-01").order("created_at"),
    supabase.from("business_holidays").select("holiday, name").gte("holiday", now.toISOString().slice(0, 10)).order("holiday"),
    supabase.from("coaching_questions").select("session_id, body"),
  ]);
  const qBySession = new Map<string, string[]>();
  for (const q of questions.data ?? []) qBySession.set(q.session_id as string, [...(qBySession.get(q.session_id as string) ?? []), q.body as string]);
  const months = [...new Set((apps.data ?? []).map((a) => a.target_month as string))];

  return (
    <div className="space-y-14">
      <PageHeader eyebrow="Coaching" title="Sessions and Hot Seat" lede="Weekly group coaching is Wednesdays at 1 PM Eastern; the Hot Seat is the second Tuesday at 1 PM. Generated sessions start unpublished so you can add links first." />

      <section aria-labelledby="gen" className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 id="gen" className="font-display text-xl">Create weekly sessions</h2>
          <ActionForm action={generateWeeklySessions} submitLabel="Create drafts" variant="secondary" className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Weeks ahead" htmlFor="weeks"><TextInput id="weeks" name="weeks" type="number" min={1} max={12} defaultValue={8} className="w-28" /></Field>
          </ActionForm>
          <p className="mt-2 text-xs text-ink-muted">Published holidays are skipped and listed so you can decide what to do.</p>
        </Card>
        <Card>
          <h2 className="font-display text-xl">Create a Hot Seat session</h2>
          <ActionForm action={createHotSeatSession} submitLabel="Create draft" variant="secondary" className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Month" htmlFor="hsm"><TextInput id="hsm" name="month" type="month" required defaultValue={target.targetMonth.slice(0, 7)} /></Field>
          </ActionForm>
        </Card>
      </section>

      <section aria-labelledby="sessions">
        <SectionTitle id="sessions">Sessions</SectionTitle>
        <div className="grid gap-4">
          {((sessions.data ?? []) as S[]).map((s) => (
            <Card key={s.id}>
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                  <span className="font-display text-xl">{s.title}</span>
                  <span className="text-sm text-ink-muted">{fmtDateTime(s.starts_at)}</span>
                  <Badge tone={s.published ? "plum" : "neutral"}>{s.published ? "Published" : "Draft"}</Badge>
                  {s.status !== "scheduled" ? <Badge>{s.status}</Badge> : null}
                  {!s.meeting_url_private ? <Badge>No join link</Badge> : null}
                  {qBySession.get(s.id)?.length ? <Badge>{qBySession.get(s.id)!.length} questions</Badge> : null}
                </summary>
                <div className="mt-5 grid gap-6">
                  {qBySession.get(s.id)?.length ? (
                    <div className="rounded-xl bg-rose-soft/50 p-4 text-sm"><Eyebrow>Advance questions</Eyebrow><ul className="mt-2 list-disc space-y-1 pl-5">{qBySession.get(s.id)!.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
                  ) : null}
                  <ActionForm action={saveSession} submitLabel="Save session"><SessionFields s={s} /></ActionForm>
                  <ActionForm action={setSessionStatus} submitLabel={s.status === "canceled" ? "Restore session" : "Cancel session"} variant="secondary" className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="status" value={s.status === "canceled" ? "scheduled" : "canceled"} />
                    {s.status !== "canceled" ? <Field label="Note for members" htmlFor={`cn-${s.id}`}><TextInput id={`cn-${s.id}`} name="note" placeholder="Rescheduled to Thursday" /></Field> : null}
                  </ActionForm>
                </div>
              </details>
            </Card>
          ))}
          <Card tone="quiet">
            <details>
              <summary className="cursor-pointer font-semibold text-plum">Add a session manually</summary>
              <ActionForm action={saveSession} submitLabel="Create session" className="mt-4 space-y-4"><SessionFields /></ActionForm>
            </details>
          </Card>
        </div>
      </section>

      <section aria-labelledby="hotseat">
        <SectionTitle id="hotseat">Hot Seat applications</SectionTitle>
        {months.length === 0 ? <Card tone="quiet"><p className="text-ink-muted">No open applications.</p></Card> : null}
        {months.map((m) => (
          <div key={m} className="mb-8">
            <h3 className="mb-3 font-display text-xl">{fmtMonth(m)}</h3>
            <div className="grid gap-4">
              {(apps.data ?? []).filter((a) => a.target_month === m).map((a) => (
                <Card key={a.id as string}>
                  <div className="flex flex-wrap items-center gap-3"><p className="font-semibold">{a.topic as string}</p><Badge>{String(a.status).replace("_", " ")}</Badge></div>
                  <p className="mt-2 whitespace-pre-line text-sm">{a.details as string}</p>
                  {a.redaction_requests ? <p className="mt-2 rounded-xl bg-rose-soft/50 p-3 text-sm"><strong>Keep confidential:</strong> {a.redaction_requests as string}</p> : null}
                  {a.status === "submitted" ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {(["selected", "not_selected", "carry"] as const).map((d) => (
                        <ActionForm key={d} action={decideHotSeat} submitLabel={d === "selected" ? "Select" : d === "not_selected" ? "Not this month" : "Carry to next month"} variant={d === "selected" ? "primary" : "secondary"} className="flex items-end gap-2">
                          <input type="hidden" name="id" value={a.id as string} />
                          <input type="hidden" name="decision" value={d} />
                          {d === "not_selected" ? <TextInput name="note" placeholder="Optional note to the member" className="min-h-9 w-56 text-sm" /> : null}
                        </ActionForm>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      {isAdmin ? (
        <section aria-labelledby="holidays">
          <SectionTitle id="holidays">Published holidays</SectionTitle>
          <Card>
            <p className="text-sm text-ink-muted">Used to skip coaching sessions and to calculate business day response targets.</p>
            <ul className="mt-3 divide-y divide-rose-soft">
              {(holidays.data ?? []).map((h) => (
                <li key={h.holiday as string} className="flex items-center justify-between gap-3 py-2">
                  <span>{h.holiday as string}: {h.name as string}</span>
                  <ActionForm action={saveHoliday} submitLabel="Remove" variant="quiet"><input type="hidden" name="holiday" value={h.holiday as string} /><input type="hidden" name="remove" value="true" /></ActionForm>
                </li>
              ))}
            </ul>
            <ActionForm action={saveHoliday} submitLabel="Add holiday" variant="secondary" className="mt-4 flex flex-wrap items-end gap-3">
              <Field label="Date" htmlFor="hol-d"><TextInput id="hol-d" name="holiday" type="date" required /></Field>
              <Field label="Name" htmlFor="hol-n"><TextInput id="hol-n" name="name" required /></Field>
            </ActionForm>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
