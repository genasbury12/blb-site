import type { Metadata } from "next";
import { respondToFeedback } from "@/app/admin/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, Stat } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Feedback queue" };

export default async function AdminFeedbackPage() {
  const { supabase } = await requireStaff(["admin", "coach"], "/admin/feedback");
  const [open, recent] = await Promise.all([
    supabase.from("feedback_submissions").select("id, user_id, deliverable_title, description, link_url, file_key, state, response_due_at, created_at").in("state", ["submitted", "in_review"]).order("response_due_at"),
    supabase.from("feedback_submissions").select("id, deliverable_title, responded_at, response_due_at").eq("state", "responded").order("responded_at", { ascending: false }).limit(10),
  ]);
  const now = new Date().getTime();
  const items = open.data ?? [];
  const overdue = items.filter((i) => new Date(i.response_due_at as string).getTime() < now).length;
  const ids = [...new Set(items.map((i) => i.user_id as string))];
  const { data: names } = ids.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", ids) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.user_id as string, (n.display_name as string) ?? "Member"]));
  const onTime = (recent.data ?? []).filter((r) => r.responded_at && new Date(r.responded_at as string) <= new Date(r.response_due_at as string)).length;

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Feedback" title="Feedback queue" lede="Ordered by due date. The target is three business days, excluding published holidays. Coaches see members assigned to them." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><Stat label="Waiting" value={String(items.length)} /></Card>
        <Card><Stat label="Past due" value={String(overdue)} /></Card>
        <Card><Stat label="On time, last 10" value={`${onTime} of ${recent.data?.length ?? 0}`} /></Card>
      </div>
      <section aria-labelledby="queue">
        <SectionTitle id="queue">Waiting for a response</SectionTitle>
        {items.length === 0 ? <Card tone="quiet"><p className="text-ink-muted">Nothing waiting.</p></Card> : null}
        <div className="grid gap-4">
          {items.map((f) => {
            const late = new Date(f.response_due_at as string).getTime() < now;
            return (
              <Card key={f.id as string}>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-2xl">{f.deliverable_title as string}</h3>
                  <Badge tone={late ? "plum" : "neutral"}>{late ? "Past due" : `Due ${fmtShort(f.response_due_at as string)}`}</Badge>
                  {f.state === "in_review" ? <Badge>In review</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-ink-muted">From {nameOf.get(f.user_id as string) ?? "Member"} · {fmtShort(f.created_at as string)}</p>
                <p className="mt-3 whitespace-pre-line">{f.description as string}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  {f.link_url ? <a className="text-plum underline" href={f.link_url as string} target="_blank" rel="noopener noreferrer">Their link</a> : null}
                  {f.file_key ? <a className="text-plum underline" href={`/api/files/feedback/${f.id}`}>Their file</a> : null}
                </div>
                <div className="mt-5 grid gap-4 border-t border-rose-soft pt-5">
                  {f.state === "submitted" ? (
                    <ActionForm action={respondToFeedback} submitLabel="Start review" variant="secondary"><input type="hidden" name="id" value={f.id as string} /><input type="hidden" name="state" value="in_review" /></ActionForm>
                  ) : null}
                  <ActionForm action={respondToFeedback} submitLabel="Send response">
                    <input type="hidden" name="id" value={f.id as string} /><input type="hidden" name="state" value="responded" />
                    <Field label="Written response" htmlFor={`rt-${f.id}`}><TextArea id={`rt-${f.id}`} name="response_text" className="min-h-40" /></Field>
                    <Field label="Or a recording link (https)" htmlFor={`rv-${f.id}`}><TextInput id={`rv-${f.id}`} name="response_video_url" type="url" /></Field>
                  </ActionForm>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
