import { Download, ExternalLink, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { completeWorksheet, saveWorksheetAnswers } from "@/app/app/worksheets/actions";
import { NoAccess } from "@/components/member/access-states";
import { CompleteToggle } from "@/components/learning/complete-toggle";
import { CopyPrompt } from "@/components/learning/copy-prompt";
import { VideoPlayer } from "@/components/learning/video-player";
import { WorksheetForm } from "@/components/worksheets/worksheet-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { loadCurrentPath } from "@/lib/server/audit";
import { loadCatalog, loadCompletedLessonIds, loadLessonResources } from "@/lib/server/learning";
import { muxPlaybackTokens } from "@/lib/server/mux";
import { getFeatures, requireSession } from "@/lib/server/session";
import { loadLessonWorksheet } from "@/lib/server/worksheets";

export const metadata: Metadata = { title: "Lesson" };

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "text/plain": "Text",
};

export default async function LessonPage({ params }: { params: Promise<{ moduleSlug: string; lessonSlug: string }> }) {
  const { moduleSlug, lessonSlug } = await params;
  const { supabase, user } = await requireSession(`/app/training/${moduleSlug}/${lessonSlug}`);
  const features = await getFeatures();
  if (!features.has("curriculum.read")) return <NoAccess what="Training" />;

  // Only published lessons are returned by RLS, so drafts are simply not found.
  const { modules, lessons } = await loadCatalog(supabase);
  const mod = modules.find((m) => m.slug === moduleSlug);
  if (!mod) notFound();
  const moduleLessons = lessons.filter((l) => l.module_id === mod.id).sort((a, b) => a.order_index - b.order_index);
  const lesson = moduleLessons.find((l) => l.slug === lessonSlug);
  if (!lesson) notFound();
  const [completed, resources, path, worksheet] = await Promise.all([
    loadCompletedLessonIds(supabase, user.id),
    loadLessonResources(supabase, lesson.id),
    loadCurrentPath(supabase),
    loadLessonWorksheet(supabase, user.id, lesson.id),
  ]);
  const idx = moduleLessons.indexOf(lesson);
  const prev = moduleLessons[idx - 1];
  const next = moduleLessons[idx + 1];
  const tokens = lesson.video_provider === "mux" && lesson.video_provider_id && lesson.captions_ready ? muxPlaybackTokens(lesson.video_provider_id) : null;
  const pathNote = path === "build_from_scratch" ? lesson.path_note_build : path === "optimize_automate" ? lesson.path_note_optimize : null;

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap gap-1.5 text-ink-muted">
          <li>
            <Link className="underline-offset-4 hover:underline" href="/app/training">My Training</Link>
            <span aria-hidden> / </span>
          </li>
          <li>
            Module {mod.number}: {mod.title}
            <span aria-hidden> / </span>
          </li>
          <li aria-current="page" className="text-ink">Lesson {lesson.order_index}</li>
        </ol>
      </nav>

      <header>
        <Eyebrow>
          Module {mod.number} · Lesson {lesson.order_index}
          {lesson.essential ? "" : " · Optional tutorial"}
          {lesson.duration_seconds ? ` · ${Math.round(lesson.duration_seconds / 60)} min` : ""}
        </Eyebrow>
        <h1 className="mt-3 font-display text-[2.4rem] font-medium leading-[1.08] sm:text-[3rem]">{lesson.title}</h1>
        {lesson.is_sample ? (
          <div className="mt-4">
            <Badge tone="sample">Sample content for testing. Not a real lesson.</Badge>
          </div>
        ) : null}
      </header>

      <section aria-label="Lesson video">
        {tokens && lesson.video_provider_id ? (
          <VideoPlayer playbackId={lesson.video_provider_id} title={lesson.title} tokens={tokens} />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-mauve/70 bg-gradient-to-br from-white to-rose-soft p-6 text-center">
            <p className="font-display text-2xl">The video is on its way</p>
            <p className="max-w-sm text-sm text-ink-muted">
              {lesson.video_provider_id ? "Video playback is being connected. The transcript below has the full lesson." : "This lesson has no video yet. Everything you need for now is below."}
            </p>
          </div>
        )}
      </section>

      {pathNote ? (
        <Card tone="feature">
          <Eyebrow>For your path</Eyebrow>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{pathNote}</p>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          {lesson.objective ? (
            <Card>
              <CardTitle className="text-xl">What you will do</CardTitle>
              <p className="mt-2 leading-relaxed">{lesson.objective}</p>
            </Card>
          ) : null}
          {lesson.assignment ? (
            <Card>
              <CardTitle className="text-xl">Your assignment</CardTitle>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{lesson.assignment}</p>
            </Card>
          ) : null}
          {lesson.transcript ? (
            <details className="rounded-[22px] border border-rose/70 bg-white p-6">
              <summary className="cursor-pointer font-display text-xl">Transcript</summary>
              <div className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed">{lesson.transcript}</div>
            </details>
          ) : null}
        </div>
        <div className="space-y-6">
          {resources.length ? (
            <Card>
              <CardTitle className="text-xl">Downloads</CardTitle>
              <ul className="mt-3 space-y-2">
                {resources.map((r) => (
                  <li key={r.id}>
                    <a href={`/api/files/lesson-resource/${r.id}`} className="flex min-h-11 items-center gap-3 rounded-xl border border-rose/70 px-3 py-2 hover:border-plum hover:bg-rose-soft/40">
                      <Download className="size-4 text-plum" aria-hidden />
                      <span className="flex-1 font-medium">{r.label}</span>
                      <span className="text-xs text-ink-muted">{TYPE_LABELS[r.mime_type] ?? "File"}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {lesson.ai_prompt ? (
            <Card>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-plum" aria-hidden />
                <CardTitle className="text-xl">AI assistant prompt</CardTitle>
              </div>
              <p className="mt-2 text-sm text-ink-muted">Paste this into your own ChatGPT or Claude account. Review and test anything AI writes before you use it.</p>
              <div className="mt-3">
                <CopyPrompt text={lesson.ai_prompt} />
              </div>
              {lesson.ai_assistant_url ? (
                <a className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-plum underline underline-offset-4" href={lesson.ai_assistant_url} target="_blank" rel="noopener noreferrer">
                  Open the assistant <ExternalLink className="size-3.5" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>

      {worksheet ? (
        <section aria-labelledby="your-worksheet" className="rounded-[28px] bg-ivory px-5 py-10 sm:px-10">
          <h2 id="your-worksheet" className="sr-only">Your worksheet</h2>
          <div>
            <WorksheetForm
              slug={worksheet.slug}
              schema={worksheet.schema}
              initialAnswers={worksheet.answers}
              initialStatus={worksheet.status}
              initialSavedAt={worksheet.updatedAt}
              lessonNumber={lesson.order_index}
              callbacks={worksheet.callbacks}
              save={saveWorksheetAnswers}
              complete={completeWorksheet}
            />
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-rose pt-6">
        <CompleteToggle lessonId={lesson.id} initiallyComplete={completed.has(lesson.id)} />
        <div className="flex flex-wrap gap-3">
          {prev ? (
            <ButtonLink href={`/app/training/${mod.slug}/${prev.slug}`} variant="secondary">
              Previous
            </ButtonLink>
          ) : null}
          <ButtonLink href={next ? `/app/training/${mod.slug}/${next.slug}` : "/app/training"} variant={next ? "primary" : "secondary"}>
            {next ? "Next lesson" : "Back to all modules"}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
