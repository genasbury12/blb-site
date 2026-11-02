import { CalendarClock, FileText, Video } from "lucide-react";
import type { Metadata } from "next";
import { addRequest, addTask, cancelPrivateSession, setTaskDone, submitCheckin } from "@/app/app/elite/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { fmtMinutes, HoursMeter, type Bucket } from "@/components/elite/hours-meter";
import { NoAccess } from "@/components/member/access-states";
import { fmtDateTime, fmtDay, fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, Eyebrow } from "@/components/ui/card";
import { requireFlag } from "@/lib/server/flags";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "My Elite Workspace" };

type Item = { id: string; kind: string; title: string; body: string | null; status: string; month_number: number | null; due_on: string | null; estimated_minutes: number | null; completion_summary: string | null; created_at: string };
const REQ: Record<string, string> = { submitted: "Waiting to be scoped", scoped: "Scoped", in_progress: "In progress", completed: "Completed", declined: "Outside scope" };
const THEMES = ["Clarity & Foundation", "Brand & Business Home", "Product & Sales Infrastructure", "Content & Visibility", "Systems & Automation", "Launch, Optimize & Grow"];

export default async function EliteWorkspacePage() {
  requireFlag("elite");
  const { supabase, user } = await requireSession("/app/elite");
  const features = await getFeatures();
  const full = features.has("elite_board.access");
  const hours = features.has("elite_dfu_hours.use");
  if (!full && !hours) return <NoAccess what="The Elite workspace" />;
  const { data: board } = await supabase.from("elite_boards").select("id, coach_id").eq("client_id", user.id).maybeSingle();
  if (!board) return <Alert tone="info" title="Your workspace is being prepared">It appears here as soon as your enrollment is confirmed.</Alert>;
  const now = new Date();
  const [items, bucketsRes, entries, sessions, checkins, files] = await Promise.all([
    supabase.from("elite_items").select("id, kind, title, body, status, month_number, due_on, estimated_minutes, completion_summary, created_at").eq("board_id", board.id).neq("status", "archived").order("created_at", { ascending: false }),
    supabase.rpc("elite_hours_summary", { p_board: board.id }),
    supabase.from("elite_time_entries").select("id, minutes, work_date, note, item_id, voided_at").eq("board_id", board.id).is("voided_at", null).order("work_date", { ascending: false }).limit(30),
    full ? supabase.from("elite_sessions").select("id, starts_at, meeting_url_private, status").eq("board_id", board.id).gte("starts_at", new Date(now.getTime() - 3600000).toISOString()).order("starts_at").limit(4) : Promise.resolve({ data: [] }),
    full ? supabase.from("elite_checkins").select("session_id, submitted_at, due_at") .eq("board_id", board.id) : Promise.resolve({ data: [] }),
    supabase.from("elite_files").select("id, label, created_at").eq("board_id", board.id).order("created_at", { ascending: false }),
  ]);
  const all = (items.data ?? []) as Item[];
  const requests = all.filter((i) => i.kind === "request");
  const buckets = (bucketsRes.data ?? []) as Bucket[];
  const next = (sessions.data ?? []).find((s) => s.status === "scheduled");
  const nextCheckin = next ? (checkins.data ?? []).find((c) => c.session_id === next.id) : null;
  const titleOf = new Map(requests.map((r) => [r.id, r.title]));

  return (
    <div className="space-y-14">
      <PageHeader eyebrow="BOSS Elite" title="Your private workspace" lede={full ? "Your roadmap, weekly check-ins, private sessions, and done for you work in one place. Only you and your coach can see it." : undefined} />
      {!full ? <Alert tone="info" title="Your coaching period has ended">You can still request work and see your hours until your included hours expire. Board retention keeps the full workspace if you want it.</Alert> : null}

      {full ? (
        <section aria-labelledby="week" className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Card tone="feature">
            <Eyebrow>Your next private session</Eyebrow>
            {next ? (
              <>
                <p className="mt-2 flex items-center gap-2 font-display text-2xl"><CalendarClock className="size-5 text-plum" aria-hidden />{fmtDateTime(next.starts_at as string)}</p>
                <p className="mt-1 text-sm text-ink-muted">60 minutes. Reschedule at least 24 hours ahead; later cancellations are forfeited.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {next.meeting_url_private ? (
                    <a href={next.meeting_url_private as string} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-plum px-5 font-semibold text-white hover:bg-plum-deep"><Video className="size-4" aria-hidden />Join link<span className="sr-only"> (opens in a new tab)</span></a>
                  ) : null}
                  <ActionForm action={cancelPrivateSession} submitLabel="Cancel this session" variant="secondary"><input type="hidden" name="id" value={next.id as string} /></ActionForm>
                </div>
              </>
            ) : <p className="mt-2 text-ink-muted">Your coach will add your weekly sessions here.</p>}
          </Card>
          <Card>
            <h2 id="week" className="font-display text-2xl">Weekly check-in</h2>
            {next ? (
              <>
                <p className="mt-1 text-sm text-ink-muted">Due {fmtShort(new Date(new Date(next.starts_at as string).getTime() - 86400000))} Eastern, 24 hours before your session.</p>
                {nextCheckin ? <Badge tone="plum">Submitted {fmtShort(nextCheckin.submitted_at as string)}</Badge> : null}
                <ActionForm action={submitCheckin} submitLabel={nextCheckin ? "Update check-in" : "Submit check-in"} className="mt-4 space-y-3">
                  <input type="hidden" name="board_id" value={board.id as string} />
                  <input type="hidden" name="session_id" value={next.id as string} />
                  <Field label="What did you accomplish?" htmlFor="ci-a"><TextArea id="ci-a" name="accomplishments" required className="min-h-20" /></Field>
                  <Field label="What got in the way?" htmlFor="ci-c"><TextArea id="ci-c" name="challenges" required className="min-h-20" /></Field>
                  <Field label="Next week's top three priorities" htmlFor="ci-p"><TextArea id="ci-p" name="top_priorities" required className="min-h-20" /></Field>
                  <Field label="Where do you need help?" htmlFor="ci-h"><TextArea id="ci-h" name="help_needed" required className="min-h-20" /></Field>
                </ActionForm>
              </>
            ) : <p className="mt-2 text-sm text-ink-muted">Check-ins open once a session is scheduled.</p>}
          </Card>
        </section>
      ) : null}

      {full ? (
        <section aria-labelledby="roadmap">
          <SectionTitle id="roadmap">Your custom roadmap</SectionTitle>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t, i) => {
              const monthItems = all.filter((x) => x.kind === "roadmap" && x.month_number === i + 1);
              return (
                <li key={t}>
                  <Card className="h-full p-5">
                    <Eyebrow>Month {i + 1}</Eyebrow>
                    <p className="font-display text-xl">{t}</p>
                    {monthItems.length ? <ul className="mt-2 space-y-1 text-sm">{monthItems.map((m) => <li key={m.id}>{m.title}{m.status === "done" ? " (done)" : ""}</li>)}</ul> : <p className="mt-2 text-sm text-ink-muted">Your coach adds this month after your audit.</p>}
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {full ? (
        <section aria-labelledby="tasks" className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 id="tasks" className="font-display text-2xl">Tasks and deliverables</h2>
            <ul className="mt-3 divide-y divide-rose-soft">
              {all.filter((x) => x.kind === "task" || x.kind === "deliverable").map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className={t.status === "done" ? "text-ink-muted line-through" : ""}>{t.title}</span>
                  {t.kind === "deliverable" ? <Badge>Deliverable</Badge> : null}
                  {t.due_on ? <span className="text-xs text-ink-muted">Due {fmtDay(t.due_on)}</span> : null}
                  {t.kind === "task" ? (
                    <ActionForm action={setTaskDone} submitLabel={t.status === "done" ? "Reopen" : "Done"} variant="quiet" className="ml-auto">
                      <input type="hidden" name="id" value={t.id} /><input type="hidden" name="done" value={t.status === "done" ? "false" : "true"} />
                    </ActionForm>
                  ) : null}
                </li>
              ))}
            </ul>
            <ActionForm action={addTask} submitLabel="Add task" variant="secondary" className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <input type="hidden" name="board_id" value={board.id as string} />
              <Field label="New task" htmlFor="t-new"><TextInput id="t-new" name="title" required /></Field>
              <Field label="Due" htmlFor="t-due"><TextInput id="t-due" name="due_on" type="date" /></Field>
            </ActionForm>
          </Card>
          <Card>
            <h2 className="font-display text-2xl">Your audit and files</h2>
            {all.filter((x) => x.kind === "audit").map((a) => (
              <div key={a.id} className="mt-3 rounded-xl bg-rose-soft/40 p-4"><p className="font-semibold">{a.title}</p>{a.body ? <p className="mt-1 whitespace-pre-line text-sm">{a.body}</p> : null}</div>
            ))}
            <ul className="mt-3 space-y-2">
              {(files.data ?? []).map((f) => (
                <li key={f.id as string}><a className="inline-flex items-center gap-2 font-medium text-plum underline-offset-4 hover:underline" href={`/api/files/elite/${f.id}`}><FileText className="size-4" aria-hidden />{f.label as string}</a></li>
              ))}
            </ul>
            {!(files.data ?? []).length && !all.some((x) => x.kind === "audit") ? <p className="mt-2 text-sm text-ink-muted">Your coach-led audit and roadmap PDF arrive within seven business days of receiving everything needed.</p> : null}
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="dfy" className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <h2 id="dfy" className="font-display text-2xl">Done for you requests</h2>
          <p className="mt-1 text-sm text-ink-muted">Your coach prioritizes the work, shares a timeline, and records the actual time after each task.</p>
          <ul className="mt-4 space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl border border-rose/70 p-4">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{r.title}</p><Badge tone={r.status === "completed" ? "plum" : "neutral"}>{REQ[r.status] ?? r.status}</Badge></div>
                {r.body ? <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{r.body}</p> : null}
                {r.estimated_minutes ? <p className="mt-1 text-sm">Estimate: {fmtMinutes(r.estimated_minutes)}{r.due_on ? `, target ${fmtDay(r.due_on)}` : ""}</p> : null}
                {r.completion_summary ? <p className="mt-2 rounded-lg bg-rose-soft/50 p-3 text-sm">{r.completion_summary}</p> : null}
              </li>
            ))}
          </ul>
          <ActionForm action={addRequest} submitLabel="Send request" className="mt-5 space-y-3">
            <input type="hidden" name="board_id" value={board.id as string} />
            <Field label="What do you need done?" htmlFor="rq-t"><TextInput id="rq-t" name="title" required /></Field>
            <Field label="Details, links, and what done looks like" hint="Never paste passwords here. Your coach will set up secure access with you." htmlFor="rq-b"><TextArea id="rq-b" name="body" required /></Field>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Your hours</h2>
          <div className="mt-4"><HoursMeter buckets={buckets} /></div>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-mauve-ink">Time recorded</h3>
          <ul className="mt-2 divide-y divide-rose-soft text-sm">
            {(entries.data ?? []).map((e) => (
              <li key={e.id as string} className="py-2"><span className="font-semibold">{fmtMinutes(e.minutes as number)}</span> on {fmtDay(e.work_date as string)}: {e.note as string}{e.item_id && titleOf.get(e.item_id as string) ? ` (${titleOf.get(e.item_id as string)})` : ""}</li>
            ))}
          </ul>
          {!(entries.data ?? []).length ? <p className="mt-2 text-sm text-ink-muted">No time recorded yet.</p> : null}
        </Card>
      </section>
    </div>
  );
}
