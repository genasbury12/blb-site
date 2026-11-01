import type { Metadata } from "next";
import { NoAccess } from "@/components/member/access-states";
import { RoadmapItemToggle } from "@/components/learning/roadmap-item-toggle";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { loadRuns } from "@/lib/server/audit";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "My Roadmap" };

const THEMES = ["Clarity & Foundation", "Brand & Business Home", "Product & Sales Infrastructure", "Content & Visibility", "Systems & Automation", "Launch, Optimize & Grow"];

type Item = { id: string; source_audit_run_id: string | null; month_number: number; priority_order: number; title: string; reason: string | null; state: string };

export default async function RoadmapPage() {
  const { supabase, user } = await requireSession("/app/roadmap");
  const features = await getFeatures();
  if (!features.has("roadmap.use")) return <NoAccess what="The roadmap" />;
  const runs = await loadRuns(supabase, user.id);
  if (!runs.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl">My Roadmap</h1>
        <Card>
          <CardTitle className="text-xl">Your roadmap starts with your audit</CardTitle>
          <p className="mt-2 text-ink-muted">Finish the business audit and your six month roadmap appears here.</p>
          <ButtonLink href="/app/audit" className="mt-4">Start My Business Audit</ButtonLink>
        </Card>
      </div>
    );
  }
  const { data, error } = await supabase
    .from("roadmap_items")
    .select("id, source_audit_run_id, month_number, priority_order, title, reason, state")
    .eq("user_id", user.id)
    .order("month_number")
    .order("priority_order");
  if (error) throw new Error(error.message);
  const items = (data ?? []) as Item[];
  const latestRunId = runs[0]!.id;
  const current = items.filter((i) => i.source_audit_run_id === latestRunId);
  const earlierDone = items.filter((i) => i.source_audit_run_id !== latestRunId && i.state === "done");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl sm:text-5xl">My Roadmap</h1>
        <p className="mt-3 max-w-prose text-ink-muted">Six themed months to guide your focus. Nothing is locked and nothing resets if you fall behind.</p>
      </header>
      <ol className="grid gap-4 md:grid-cols-2">
        {THEMES.map((theme, i) => {
          const monthItems = current.filter((it) => it.month_number === i + 1);
          return (
            <li key={theme}>
              <Card className="h-full">
                <Eyebrow>Month {i + 1}</Eyebrow>
                <CardTitle className="mt-1 text-xl">{theme}</CardTitle>
                <ul className="mt-3 space-y-2">
                  {monthItems.map((it) => (
                    <li key={it.id}>
                      <RoadmapItemToggle itemId={it.id} title={it.title} initiallyDone={it.state === "done"} />
                      {it.reason ? <p className="ml-8 text-sm text-ink-muted">{it.reason}</p> : null}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          );
        })}
      </ol>
      {earlierDone.length ? (
        <section aria-labelledby="earlier">
          <h2 id="earlier" className="text-2xl">Completed from earlier reports</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {earlierDone.map((it) => (
              <li key={it.id}>{it.title}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
