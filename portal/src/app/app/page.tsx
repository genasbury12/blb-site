import { ArrowRight, CalendarClock, Gem, MessageCircleHeart, MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BillingNotices, formatDate, NoAccess } from "@/components/member/access-states";
import { fmtDateTime } from "@/components/member/time";
import { Ornament } from "@/components/shell/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { currentRoadmapMonth } from "@/domain/audit/submission";
import { CATEGORY_LABELS } from "@/domain/audit/types";
import { AUDIT_V1 } from "@/domain/audit/v1";
import { zonedParts } from "@/domain/schedule/calendar";
import { isFeatureEnabled } from "@/lib/env";
import { loadCurrentPath, loadDraft, loadPublishedAuditVersion, loadRun, loadRuns, PATH_LABELS } from "@/lib/server/audit";
import { latestEnd, loadCatalog, loadCompletedLessonIds, loadGrants, loadMilestoneSummary } from "@/lib/server/learning";
import { getBillingNotices, getFeatures, requireSession } from "@/lib/server/session";
import { loadUnfinishedWorksheet } from "@/lib/server/worksheets";

export const metadata: Metadata = { title: "My Dashboard" };

const THEMES = ["Clarity & Foundation", "Brand & Business Home", "Product & Sales Infrastructure", "Content & Visibility", "Systems & Automation", "Launch, Optimize & Grow"];

function greeting(now: Date) {
  const h = zonedParts(now).hour;
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Header({ today, hello, lede }: { today: string; hello: string; lede?: string }) {
  return (
    <header className="mb-10">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-mauve-ink">{today}</p>
      <h1 className="mt-2 font-display text-[2.6rem] font-medium leading-[1.05] sm:text-[3.4rem]">{hello}</h1>
      <Ornament className="mt-5" />
      {lede ? <p className="mt-4 text-ink-muted">{lede}</p> : null}
    </header>
  );
}

export default async function DashboardPage() {
  const { supabase, user } = await requireSession("/app");
  const [features, notices, profile] = await Promise.all([getFeatures(), getBillingNotices(), supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle()]);
  const name = profile.data?.display_name as string | undefined;
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" }).format(now);
  const hello = `${greeting(now)}${name ? `, ${name}` : ""}`;

  const elite = features.has("elite_board.access") || features.has("elite_dfu_hours.use");
  if (!features.has("curriculum.read") && !elite) {
    return (
      <div className="space-y-6">
        <Header today={today} hello={hello} />
        <BillingNotices notices={notices} />
        <NoAccess what="Training" />
        <ButtonLink href="/app/plans" variant="secondary">See plans</ButtonLink>
      </div>
    );
  }

  const coaching = isFeatureEnabled("coaching") && features.has("group_coaching.access");
  const feedbackOn = isFeatureEnabled("feedback") && features.has("feedback.submit");
  const eliteOn = isFeatureEnabled("elite") && features.has("elite_coaching.access");
  const [version, runs, catalog, completed, milestones, grants, path, nextGroup, fbCycle, eliteBoard, unfinished] = await Promise.all([
    loadPublishedAuditVersion(supabase),
    loadRuns(supabase, user.id),
    loadCatalog(supabase),
    loadCompletedLessonIds(supabase, user.id),
    loadMilestoneSummary(supabase, user.id),
    loadGrants(supabase, user.id),
    loadCurrentPath(supabase),
    coaching ? supabase.from("coaching_sessions").select("title, starts_at, kind").eq("status", "scheduled").gte("starts_at", now.toISOString()).order("starts_at").limit(1).maybeSingle() : Promise.resolve({ data: null }),
    feedbackOn ? supabase.rpc("my_feedback_cycle") : Promise.resolve({ data: null }),
    eliteOn ? supabase.from("elite_boards").select("id").eq("client_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    loadUnfinishedWorksheet(supabase, user.id),
  ]);
  const draft = version ? await loadDraft(supabase, user.id, version.id) : null;
  const latest = runs[0] ? await loadRun(supabase, runs[0].id) : null;
  const nextElite = eliteBoard?.data?.id
    ? (await supabase.from("elite_sessions").select("starts_at").eq("board_id", eliteBoard.data.id).eq("status", "scheduled").gte("starts_at", now.toISOString()).order("starts_at").limit(1).maybeSingle()).data
    : null;

  const essential = catalog.lessons.filter((l) => l.essential);
  const essentialDone = essential.filter((l) => completed.has(l.id)).length;
  const learningPct = essential.length ? (essentialDone / essential.length) * 100 : 0;
  const milestonePct = milestones.total ? (milestones.done / milestones.total) * 100 : 0;
  const curriculumStart = grants.filter((g) => g.feature_key === "curriculum.read").map((g) => new Date(g.starts_at)).sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const month = currentRoadmapMonth(curriculumStart, now);

  const moduleSlug = new Map(catalog.modules.map((m) => [m.id, m.slug]));
  const starting = latest?.recommendation_snapshot_json.startingLesson ?? null;
  const startingRow = starting ? catalog.lessons.find((l) => l.id === starting.lessonId) : undefined;
  const nextIncomplete = essential.find((l) => !completed.has(l.id));
  let next: { eyebrow: string; title: string; body: string; href: string; cta: string };
  if (!latest && features.has("audit.use")) {
    const answered = Object.keys(draft?.answers_json ?? {}).length;
    next = draft
      ? { eyebrow: "Pick up where you left off", title: "Finish your business audit", body: `You have answered ${answered} of ${AUDIT_V1.questions.length} questions. Your answers are saved.`, href: "/app/audit", cta: "Resume my audit" }
      : { eyebrow: "Start here", title: "Start your business audit", body: "Thirty quick questions show you where your business stands and what to work on first. It takes about ten minutes and saves as you go.", href: "/app/audit", cta: "Start My Business Audit" };
  } else if (unfinished) {
    // Slice E: a worksheet the member started and has not finished comes before the next lesson.
    next = {
      eyebrow: "Pick up where you left off",
      title: `Finish your Lesson ${unfinished.lessonNumber} worksheet`,
      body: `${unfinished.title}. Your answers are saved, so you can pick up right where you stopped.`,
      href: unfinished.href,
      cta: "Open my worksheet",
    };
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
  const fb = (fbCycle?.data as { used: number }[] | null)?.[0];

  return (
    <div className="space-y-10">
      <Header today={today} hello={hello} lede={path ? `Your path: ${PATH_LABELS[path]}` : undefined} />
      <BillingNotices notices={notices} />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card tone="feature" className="relative overflow-hidden p-8 sm:p-10">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-rose/40 blur-2xl" />
          <Eyebrow>{next.eyebrow}</Eyebrow>
          <h2 className="mt-3 max-w-xl font-display text-[2.2rem] font-medium leading-tight">{next.title}</h2>
          <p className="mt-3 max-w-prose text-ink-muted">{next.body}</p>
          <ButtonLink href={next.href} className="mt-6">{next.cta}<ArrowRight className="size-4" aria-hidden /></ButtonLink>
        </Card>
        <Card className="flex flex-col justify-between">
          <div>
            <Eyebrow>Roadmap month {month} of 6</Eyebrow>
            <p className="mt-2 font-display text-[1.8rem] leading-tight">{THEMES[month - 1]}</p>
            <p className="mt-2 text-sm text-ink-muted">A suggested focus, not a deadline. Work at your own pace.</p>
          </div>
          <div className="mt-6 space-y-4">
            <ProgressBar value={learningPct} label={`${essentialDone} of ${essential.length} essential lessons`} />
            <ProgressBar value={milestonePct} label={`${milestones.done} of ${milestones.total} business milestones`} />
          </div>
        </Card>
      </div>

      {priorities.length ? (
        <section aria-labelledby="priorities">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="priorities" className="font-display text-[1.75rem] font-medium">Your top three priorities</h2>
            {latest ? <Link href={`/app/audit/results/${latest.id}`} className="text-sm font-semibold text-plum underline underline-offset-4">Full report</Link> : null}
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {priorities.map((p) => (
              <li key={p.rank}>
                <Card className="h-full">
                  <span className="numeral text-[2.6rem] leading-none text-rose-deep" aria-hidden>{p.rank}</span>
                  <p className="mt-3 font-display text-xl leading-snug">{p.title}</p>
                  <p className="mt-2 text-sm text-ink-muted">Module {p.moduleNumber}: {CATEGORY_LABELS[p.category]}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {coaching || feedbackOn || eliteOn ? (
          <Card>
            <CardTitle className="text-xl">This week</CardTitle>
            <ul className="mt-4 space-y-4">
              {coaching ? (
                <li className="flex gap-3">
                  <CalendarClock className="mt-0.5 size-5 shrink-0 text-plum" aria-hidden />
                  <div>
                    <p className="font-semibold">{nextGroup?.data ? (nextGroup.data.kind === "hot_seat" ? "Hot Seat" : "Group coaching") : "Group coaching"}</p>
                    <p className="text-sm text-ink-muted">{nextGroup?.data ? fmtDateTime(nextGroup.data.starts_at as string) : "Wednesdays at 1 PM Eastern"}</p>
                    <Link href="/app/coaching" className="text-sm font-semibold text-plum underline underline-offset-4">Coaching Hub</Link>
                  </div>
                </li>
              ) : null}
              {feedbackOn ? (
                <li className="flex gap-3">
                  <MessageCircleHeart className="mt-0.5 size-5 shrink-0 text-plum" aria-hidden />
                  <div>
                    <p className="font-semibold">{Math.max(0, 2 - (fb?.used ?? 0))} of 2 feedback submissions left this cycle</p>
                    <Link href="/app/feedback" className="text-sm font-semibold text-plum underline underline-offset-4">Submit work for review</Link>
                  </div>
                </li>
              ) : null}
              {eliteOn ? (
                <li className="flex gap-3">
                  <Gem className="mt-0.5 size-5 shrink-0 text-plum" aria-hidden />
                  <div>
                    <p className="font-semibold">Private session</p>
                    <p className="text-sm text-ink-muted">{nextElite ? `${fmtDateTime(nextElite.starts_at as string)}. Check-in due 24 hours before.` : "Your coach will schedule it soon."}</p>
                    <Link href="/app/elite" className="text-sm font-semibold text-plum underline underline-offset-4">My Elite Workspace</Link>
                  </div>
                </li>
              ) : null}
              {isFeatureEnabled("community") && features.has("community.access") ? (
                <li className="flex gap-3">
                  <MessagesSquare className="mt-0.5 size-5 shrink-0 text-plum" aria-hidden />
                  <div><p className="font-semibold">Community</p><Link href="/app/community" className="text-sm font-semibold text-plum underline underline-offset-4">See what members are sharing</Link></div>
                </li>
              ) : null}
            </ul>
          </Card>
        ) : null}
        <Card>
          <CardTitle className="text-xl">Your access</CardTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {curriculumEnds ? <li>Training, audit and library: open through {formatDate(curriculumEnds)}</li> : null}
            {coachingEnds ? <li>Coaching, community and workshops: through {formatDate(coachingEnds)}</li> : <li>Group coaching is not part of your current access.</li>}
            {features.has("feedback.submit") ? <li>Feedback: two submissions each monthly coaching cycle</li> : null}
            {features.has("elite_coaching.access") ? <li>Elite: weekly private coaching and your private workspace</li> : null}
          </ul>
          <Link href="/app/billing" className="mt-4 inline-block text-sm font-semibold text-plum underline underline-offset-4">Billing and memberships</Link>
        </Card>
      </div>
    </div>
  );
}
