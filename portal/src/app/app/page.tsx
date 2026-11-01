import type { Metadata } from "next";
import Link from "next/link";
import { BillingNotices, formatDate, NoAccess } from "@/components/member/access-states";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { currentRoadmapMonth } from "@/domain/audit/submission";
import { CATEGORY_LABELS } from "@/domain/audit/types";
import { AUDIT_V1 } from "@/domain/audit/v1";
import { loadCurrentPath, loadDraft, loadPublishedAuditVersion, loadRun, loadRuns, PATH_LABELS } from "@/lib/server/audit";
import { latestEnd, loadCatalog, loadCompletedLessonIds, loadGrants, loadMilestoneSummary } from "@/lib/server/learning";
import { getBillingNotices, getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "My Dashboard" };

const THEMES = ["Clarity & Foundation", "Brand & Business Home", "Product & Sales Infrastructure", "Content & Visibility", "Systems & Automation", "Launch, Optimize & Grow"];

export default async function DashboardPage() {
  const { supabase, user } = await requireSession("/app");
  const [features, notices, profile] = await Promise.all([
    getFeatures(),
    getBillingNotices(),
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
  ]);
  const name = profile.data?.display_name as string | undefined;

  if (!features.has("curriculum.read") && !features.has("elite_board.access")) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl">{name ? `Hi, ${name}` : "Welcome"}</h1>
        <BillingNotices notices={notices} />
        <NoAccess what="Training" />
      </div>
    );
  }

  const [version, runs, catalog, completed, milestones, grants, path] = await Promise.all([
    loadPublishedAuditVersion(supabase),
    loadRuns(supabase, user.id),
    loadCatalog(supabase),
    loadCompletedLessonIds(supabase, user.id),
    loadMilestoneSummary(supabase, user.id),
    loadGrants(supabase, user.id),
    loadCurrentPath(supabase),
  ]);
  const draft = version ? await loadDraft(supabase, user.id, version.id) : null;
  const latest = runs[0] ? await loadRun(supabase, runs[0].id) : null;

  const essential = catalog.lessons.filter((l) => l.essential);
  const essentialDone = essential.filter((l) => completed.has(l.id)).length;
  const learningPct = essential.length ? (essentialDone / essential.length) * 100 : 0;
  const milestonePct = milestones.total ? (milestones.done / milestones.total) * 100 : 0;

  const curriculumStart = grants
    .filter((g) => g.feature_key === "curriculum.read")
    .map((g) => new Date(g.starts_at))
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const month = currentRoadmapMonth(curriculumStart, new Date());

  // One primary next action (Phase 2 Decision 6: audit first, but training is never locked).
  const moduleSlug = new Map(catalog.modules.map((m) => [m.id, m.slug]));
  const starting = latest?.recommendation_snapshot_json.startingLesson ?? null;
  const startingRow = starting ? catalog.lessons.find((l) => l.id === starting.lessonId) : undefined;
  const nextIncomplete = essential.find((l) => !completed.has(l.id));
  let next: { eyebrow: string; title: string; body: string; href: string; cta: string };
  if (!latest && features.has("audit.use")) {
    const answered = Object.keys(draft?.answers_json ?? {}).length;
    next = draft
      ? { eyebrow: "Next step", title: "Finish your business audit", body: `You have answered ${answered} of ${AUDIT_V1.questions.length} questions. Your answers are saved.`, href: "/app/audit", cta: "Resume my audit" }
      : { eyebrow: "Start here", title: "Start your business audit", body: "Thirty quick questions show you where your business stands and what to work on first. It takes about 10 minutes and saves as you go.", href: "/app/audit", cta: "Start My Business Audit" };
  } else if (startingRow && !completed.has(startingRow.id)) {
    next = { eyebrow: "Recommended from your audit", title: startingRow.title, body: "This is the starting lesson matched to your top priority.", href: `/app/training/${moduleSlug.get(startingRow.module_id)}/${startingRow.slug}`, cta: "Open lesson" };
  } else if (nextIncomplete) {
    next = { eyebrow: "Keep going", title: nextIncomplete.title, body: "Your next essential lesson.", href: `/app/training/${moduleSlug.get(nextIncomplete.module_id)}/${nextIncomplete.slug}`, cta: "Open lesson" };
  } else {
    next = { eyebrow: "Next step", title: "Review your roadmap", body: "You have finished the essential lessons that are published so far.", href: "/app/roadmap", cta: "Open my roadmap" };
  }

  const priorities = latest?.recommendation_snapshot_json.priorityRecommendations ?? [];
  const coachingEnds = latestEnd(grants, "group_coaching.access");
  const curriculumEnds = latestEnd(grants, "curriculum.read");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl sm:text-5xl">{name ? `Hi, ${name}` : "Welcome"}</h1>
        {path ? <p className="mt-2 text-ink-muted">Your path: {PATH_LABELS[path]}</p> : null}
      </div>
      <BillingNotices notices={notices} />

      <Card className="border-plum">
        <Eyebrow>{next.eyebrow}</Eyebrow>
        <CardTitle className="mt-2 text-3xl">{next.title}</CardTitle>
        <p className="mt-2 max-w-prose text-ink-muted">{next.body}</p>
        <ButtonLink href={next.href} className="mt-5">
          {next.cta}
        </ButtonLink>
      </Card>

      {priorities.length ? (
        <section aria-labelledby="priorities">
          <h2 id="priorities" className="text-2xl">Your top three priorities</h2>
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            {priorities.map((p) => (
              <li key={p.rank}>
                <Card className="h-full p-5">
                  <Eyebrow>Priority {p.rank}</Eyebrow>
                  <p className="mt-1 font-semibold">{p.title}</p>
                  <p className="mt-1 text-sm text-ink-muted">Module {p.moduleNumber}: {CATEGORY_LABELS[p.category]}</p>
                </Card>
              </li>
            ))}
          </ol>
          {latest ? (
            <Link href={`/app/audit/results/${latest.id}`} className="mt-3 inline-block text-sm font-semibold text-plum underline underline-offset-4">
              See your full audit report
            </Link>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="text-xl">Learning</CardTitle>
          <div className="mt-3">
            <ProgressBar value={learningPct} label={`${essentialDone} of ${essential.length} essential lessons complete`} />
          </div>
        </Card>
        <Card>
          <CardTitle className="text-xl">Business milestones</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">Tracked separately from lessons. Finishing a lesson does not mark a milestone done.</p>
          <div className="mt-3">
            <ProgressBar value={milestonePct} label={`${milestones.done} of ${milestones.total} milestones done`} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Eyebrow>Roadmap month {month} of 6</Eyebrow>
          <CardTitle className="mt-1 text-xl">{THEMES[month - 1]}</CardTitle>
          <p className="mt-2 text-sm text-ink-muted">A suggested focus, not a deadline. Work at your own pace.</p>
          {features.has("roadmap.use") ? (
            <Link href="/app/roadmap" className="mt-3 inline-block text-sm font-semibold text-plum underline underline-offset-4">
              Open my roadmap
            </Link>
          ) : null}
        </Card>
        <Card>
          <CardTitle className="text-xl">Your access</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {curriculumEnds ? <li>Training and audit: open through {formatDate(curriculumEnds)}</li> : null}
            {coachingEnds ? <li>Group coaching and community: through {formatDate(coachingEnds)}</li> : <li>Group coaching is not included in your current access.</li>}
            {features.has("feedback.submit") ? <li>Feedback: two submissions each monthly coaching cycle</li> : null}
            {features.has("elite_coaching.access") ? (
              <li>
                <Badge tone="plum">Elite</Badge> Weekly private coaching and your private workspace
              </li>
            ) : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}
