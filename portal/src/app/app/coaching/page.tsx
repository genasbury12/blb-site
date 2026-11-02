import { CalendarClock, PlayCircle, Video } from "lucide-react";
import type { Metadata } from "next";
import { applyHotSeat, askQuestion, updateHotSeat } from "@/app/app/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { NoAccess } from "@/components/member/access-states";
import { fmtDateTime, fmtMonth, fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, Eyebrow } from "@/components/ui/card";
import { HOTSEAT_CONSENT_TEXT } from "@/domain/coaching";
import { hotSeatTarget } from "@/domain/schedule/calendar";
import { requireFlag } from "@/lib/server/flags";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Coaching" };

type Session = { id: string; kind: "group" | "hot_seat"; title: string; agenda: string | null; starts_at: string; ends_at: string; meeting_url_private: string | null; recording_url_private: string | null; status: string; cancel_note: string | null };
const STATUS: Record<string, string> = { submitted: "Submitted", selected: "Selected", not_selected: "Not selected this month", carried_forward: "Carried to next month", withdrawn: "Withdrawn" };

export default async function CoachingPage() {
  requireFlag("coaching");
  const { supabase, user } = await requireSession("/app/coaching");
  const features = await getFeatures();
  if (!features.has("group_coaching.access")) return <NoAccess what="Group coaching" />;
  const now = new Date();
  const target = hotSeatTarget(now);
  const [upcoming, past, questions, apps] = await Promise.all([
    supabase.from("coaching_sessions").select("*").gte("ends_at", now.toISOString()).order("starts_at").limit(8),
    supabase.from("coaching_sessions").select("*").lt("ends_at", now.toISOString()).or("recording_url_private.not.is.null,recording_playback_id.not.is.null").order("starts_at", { ascending: false }).limit(24),
    supabase.from("coaching_questions").select("id, session_id, body").eq("user_id", user.id),
    supabase.from("hotseat_applications").select("id, target_month, topic, details, redaction_requests, status, decision_note").eq("user_id", user.id).order("target_month", { ascending: false }),
  ]);
  const sessions = (upcoming.data ?? []) as Session[];
  const replays = (past.data ?? []) as Session[];
  const myQuestions = questions.data ?? [];
  const current = (apps.data ?? []).find((a) => a.target_month === target.targetMonth && a.status !== "withdrawn");

  return (
    <div className="space-y-14">
      <PageHeader eyebrow="Coaching Hub" title="Coaching and Hot Seat" lede="Group coaching is every Wednesday at 1 PM Eastern. Send your question ahead of time, join live, or watch the replay while your coaching is active." />

      <section aria-labelledby="upcoming">
        <SectionTitle id="upcoming">Upcoming sessions</SectionTitle>
        {sessions.length === 0 ? (
          <Card tone="quiet"><p className="text-ink-muted">The next sessions will appear here once they are scheduled.</p></Card>
        ) : (
          <ol className="grid gap-4">
            {sessions.map((s, i) => {
              const mine = myQuestions.filter((q) => q.session_id === s.id);
              const live = new Date(s.starts_at).getTime() - now.getTime() < 15 * 60 * 1000;
              return (
                <li key={s.id}>
                  <Card tone={i === 0 ? "feature" : "plain"}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <Eyebrow>{s.kind === "hot_seat" ? "Monthly Hot Seat, 90 minutes" : "Weekly group coaching, 60 minutes"}</Eyebrow>
                        <h3 className="mt-1 font-display text-2xl">{s.title}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm"><CalendarClock className="size-4 text-plum" aria-hidden />{fmtDateTime(s.starts_at)}</p>
                        {s.agenda ? <p className="mt-2 max-w-prose text-sm text-ink-muted">{s.agenda}</p> : null}
                      </div>
                      {s.status === "canceled" ? (
                        <Badge>Canceled{s.cancel_note ? `: ${s.cancel_note}` : ""}</Badge>
                      ) : s.meeting_url_private ? (
                        <a href={s.meeting_url_private} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold ${live ? "bg-plum text-white hover:bg-plum-deep" : "border border-mauve bg-white text-ink hover:bg-rose-soft"}`}>
                          <Video className="size-4" aria-hidden />{live ? "Join now" : "Join link"}<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <Badge>Link coming soon</Badge>
                      )}
                    </div>
                    {s.status === "scheduled" ? (
                      <div className="mt-5 border-t border-rose-soft pt-4">
                        {mine.length ? <p className="mb-2 text-sm">Your questions: {mine.map((q) => q.body).join(" · ")}</p> : null}
                        <ActionForm action={askQuestion} submitLabel="Send question" variant="secondary" className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                          <input type="hidden" name="session_id" value={s.id} />
                          <Field label="Ask ahead of time" htmlFor={`q-${s.id}`}><TextInput id={`q-${s.id}`} name="body" maxLength={1500} placeholder="What do you want help with?" /></Field>
                        </ActionForm>
                      </div>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {features.has("hotseat.apply") ? (
        <section aria-labelledby="hotseat">
          <SectionTitle id="hotseat">Apply for the {fmtMonth(target.targetMonth)} Hot Seat</SectionTitle>
          <Card>
            <p className="text-sm text-ink-muted">
              The Hot Seat is on {fmtDateTime(target.sessionAt)} for 90 minutes. Applications close {fmtShort(target.closesAt)} Eastern. Selection is based on readiness, feasibility, impact and what the group can learn, and you hear back within 48 hours. Unselected applications can carry forward.
            </p>
            {current ? (
              <div className="mt-5 space-y-4">
                <p><Badge tone="plum">{STATUS[current.status as string]}</Badge></p>
                {current.decision_note ? <Alert tone="info">{current.decision_note as string}</Alert> : null}
                {current.status === "submitted" ? (
                  <>
                    <ActionForm action={updateHotSeat} submitLabel="Save changes" variant="secondary">
                      <input type="hidden" name="id" value={current.id as string} />
                      <Field label="Topic" htmlFor="hs-topic"><TextInput id="hs-topic" name="topic" defaultValue={current.topic as string} required /></Field>
                      <Field label="What you want help with" htmlFor="hs-details"><TextArea id="hs-details" name="details" defaultValue={current.details as string} required /></Field>
                      <Field label="Anything to keep confidential or remove from the replay" htmlFor="hs-red"><TextArea id="hs-red" name="redaction_requests" defaultValue={(current.redaction_requests as string) ?? ""} /></Field>
                    </ActionForm>
                    <ActionForm action={updateHotSeat} submitLabel="Withdraw application" variant="quiet">
                      <input type="hidden" name="id" value={current.id as string} />
                      <input type="hidden" name="withdraw" value="true" />
                    </ActionForm>
                  </>
                ) : null}
              </div>
            ) : (
              <ActionForm action={applyHotSeat} submitLabel="Apply" className="mt-5 space-y-4">
                <Field label="Topic" htmlFor="hs-topic"><TextInput id="hs-topic" name="topic" required maxLength={200} /></Field>
                <Field label="What you want help with" hint="Where you are, what you have tried, and what a good outcome looks like." htmlFor="hs-details"><TextArea id="hs-details" name="details" required maxLength={4000} /></Field>
                <Field label="Anything to keep confidential or remove from the replay (optional)" htmlFor="hs-red"><TextArea id="hs-red" name="redaction_requests" maxLength={1000} /></Field>
                <label className="flex gap-3 rounded-xl bg-rose-soft/50 p-4 text-sm">
                  <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-plum" />
                  <span>{HOTSEAT_CONSENT_TEXT}</span>
                </label>
              </ActionForm>
            )}
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="replays">
        <SectionTitle id="replays">Replays</SectionTitle>
        {replays.length === 0 ? (
          <Card tone="quiet"><p className="text-ink-muted">Replays appear here after each session.</p></Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {replays.map((r) => (
              <li key={r.id}>
                <Card className="p-5">
                  <Eyebrow>{r.kind === "hot_seat" ? "Hot Seat" : "Group coaching"} · {fmtShort(r.starts_at)}</Eyebrow>
                  <p className="mt-1 font-display text-xl">{r.title}</p>
                  {r.recording_url_private ? (
                    <a className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-plum underline underline-offset-4" href={r.recording_url_private} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="size-4" aria-hidden />Watch replay<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
