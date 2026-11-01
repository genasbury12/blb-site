import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess } from "@/components/member/access-states";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { loadCatalog, loadCompletedLessonIds } from "@/lib/server/learning";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "My Training" };

export default async function TrainingPage() {
  const { supabase, user } = await requireSession("/app/training");
  const features = await getFeatures();
  if (!features.has("curriculum.read")) return <NoAccess what="Training" />;
  const [{ modules, lessons }, completed] = await Promise.all([loadCatalog(supabase), loadCompletedLessonIds(supabase, user.id)]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl sm:text-5xl">My Training</h1>
        <p className="mt-3 max-w-prose text-ink-muted">All eight modules are open. Start where your audit points you, or anywhere you need help today.</p>
      </header>
      {modules.length === 0 ? (
        <Card>
          <CardTitle className="text-xl">Training is being prepared</CardTitle>
          <p className="mt-2 text-ink-muted">Modules appear here as soon as they are published.</p>
        </Card>
      ) : (
        <ol className="space-y-4">
          {modules.map((m) => {
            const moduleLessons = lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.order_index - b.order_index);
            const essential = moduleLessons.filter((l) => l.essential);
            const done = essential.filter((l) => completed.has(l.id)).length;
            return (
              <li key={m.id}>
                <Card>
                  <Eyebrow>Module {m.number}</Eyebrow>
                  <CardTitle className="mt-1">{m.title}</CardTitle>
                  <p className="mt-1 text-sm text-ink-muted">{m.outcome}</p>
                  {essential.length ? (
                    <div className="mt-4 max-w-md">
                      <ProgressBar value={(done / essential.length) * 100} label={`${done} of ${essential.length} essential lessons complete`} />
                    </div>
                  ) : null}
                  {moduleLessons.length ? (
                    <ul className="mt-4 divide-y divide-rose-soft">
                      {moduleLessons.map((l) => (
                        <li key={l.id} className="flex flex-wrap items-center gap-2 py-2">
                          <span aria-hidden className={completed.has(l.id) ? "text-success" : "text-ink-muted"}>
                            {completed.has(l.id) ? "✓" : "○"}
                          </span>
                          <Link href={`/app/training/${m.slug}/${l.slug}`} className="font-semibold text-plum underline-offset-4 hover:underline">
                            {l.title}
                          </Link>
                          <span className="sr-only">{completed.has(l.id) ? "(completed)" : "(not completed)"}</span>
                          {!l.essential ? <Badge>Optional tutorial</Badge> : null}
                          {l.is_sample ? <Badge tone="sample">Sample content</Badge> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-muted">Lessons for this module are not published yet.</p>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
