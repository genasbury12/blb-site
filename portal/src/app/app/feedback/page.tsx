import type { Metadata } from "next";
import { submitFeedback, withdrawFeedback } from "@/app/app/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { NoAccess } from "@/components/member/access-states";
import { fmtDay, fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, Eyebrow, Stat } from "@/components/ui/card";
import { requireFlag } from "@/lib/server/flags";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Feedback" };

const STATE: Record<string, string> = { submitted: "Waiting for review", in_review: "In review", responded: "Response ready", withdrawn: "Withdrawn" };

export default async function FeedbackPage() {
  requireFlag("feedback");
  const { supabase, user } = await requireSession("/app/feedback");
  const features = await getFeatures();
  if (!features.has("feedback.submit")) return <NoAccess what="Personalized feedback" />;
  const [cycle, subs] = await Promise.all([
    supabase.rpc("my_feedback_cycle"),
    supabase.from("feedback_submissions").select("id, deliverable_title, description, link_url, file_key, state, response_due_at, response_text, response_video_url, responded_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  const c = (cycle.data as { cycle_start: string | null; used: number }[] | null)?.[0];
  const used = c?.used ?? 0;
  const remaining = Math.max(0, 2 - used);
  const resets = c?.cycle_start ? new Date(new Date(c.cycle_start).setMonth(new Date(c.cycle_start).getMonth() + 1)) : null;

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Feedback" title="Personalized feedback" lede="Two submissions each monthly coaching cycle, one deliverable each. Your coach responds in writing or with a short recording within three business days." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><Stat label="Left this cycle" value={`${remaining} of 2`} /></Card>
        <Card className="sm:col-span-2"><Stat label="Next cycle starts" value={resets ? fmtDay(resets) : "Not active"} hint="Unused submissions do not roll over." /></Card>
      </div>

      <section aria-labelledby="new">
        <SectionTitle id="new">Submit work for review</SectionTitle>
        {remaining === 0 ? (
          <Alert tone="info">You have used both submissions this cycle. You can submit again when the next cycle starts.</Alert>
        ) : (
          <Card>
            <ActionForm action={submitFeedback} submitLabel="Submit for feedback" encType="multipart/form-data">
              <Field label="The one deliverable to review" hint="For example: my sales page, my welcome email, my product outline." htmlFor="fb-title"><TextInput id="fb-title" name="deliverable_title" required maxLength={140} /></Field>
              <Field label="What feedback do you want?" htmlFor="fb-desc"><TextArea id="fb-desc" name="description" required maxLength={4000} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Link (optional, https)" htmlFor="fb-link"><TextInput id="fb-link" name="link_url" type="url" placeholder="https://" /></Field>
                <Field label="File (optional, up to 25 MB)" htmlFor="fb-file"><TextInput id="fb-file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt" className="py-2" /></Field>
              </div>
            </ActionForm>
          </Card>
        )}
      </section>

      <section aria-labelledby="mine">
        <SectionTitle id="mine">Your submissions</SectionTitle>
        {(subs.data ?? []).length === 0 ? (
          <Card tone="quiet"><p className="text-ink-muted">Nothing submitted yet.</p></Card>
        ) : (
          <ul className="grid gap-4">
            {(subs.data ?? []).map((s) => (
              <li key={s.id as string}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Eyebrow>Submitted {fmtShort(s.created_at as string)}</Eyebrow>
                      <h3 className="mt-1 font-display text-2xl">{s.deliverable_title as string}</h3>
                    </div>
                    <Badge tone={s.state === "responded" ? "plum" : "neutral"}>{STATE[s.state as string]}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{s.description as string}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    {s.link_url ? <a className="text-plum underline" href={s.link_url as string} target="_blank" rel="noopener noreferrer">Your link</a> : null}
                    {s.file_key ? <a className="text-plum underline" href={`/api/files/feedback/${s.id}`}>Your file</a> : null}
                  </div>
                  {s.state === "responded" ? (
                    <div className="mt-5 rounded-2xl bg-rose-soft/50 p-5">
                      <Eyebrow>Coach response</Eyebrow>
                      {s.response_text ? <p className="mt-2 whitespace-pre-line leading-relaxed">{s.response_text as string}</p> : null}
                      {s.response_video_url ? <a className="mt-2 inline-block font-semibold text-plum underline" href={s.response_video_url as string} target="_blank" rel="noopener noreferrer">Watch the recorded response</a> : null}
                    </div>
                  ) : s.state !== "withdrawn" ? (
                    <p className="mt-3 text-sm">Response expected by {fmtShort(s.response_due_at as string)} Eastern.</p>
                  ) : null}
                  {s.state === "submitted" ? (
                    <ActionForm action={withdrawFeedback} submitLabel="Withdraw" variant="quiet" className="mt-2">
                      <input type="hidden" name="id" value={s.id as string} />
                    </ActionForm>
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
