import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoAccess } from "@/components/member/access-states";
import { CompleteToggle } from "@/components/learning/complete-toggle";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { loadCatalog, loadCompletedLessonIds, loadLessonResources } from "@/lib/server/learning";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Lesson" };

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
  const [completed, resources] = await Promise.all([loadCompletedLessonIds(supabase, user.id), loadLessonResources(supabase, lesson.id)]);
  const next = moduleLessons[moduleLessons.indexOf(lesson) + 1];

  return (
    <article className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap gap-1 text-ink-muted">
          <li><Link className="underline underline-offset-4" href="/app/training">My Training</Link> /</li>
          <li>Module {mod.number}: {mod.title} /</li>
          <li aria-current="page" className="text-ink">{lesson.title}</li>
        </ol>
      </nav>
      <header>
        <Eyebrow>Module {mod.number} lesson {lesson.order_index}{lesson.essential ? "" : ", optional tutorial"}</Eyebrow>
        <h1 className="mt-2 text-4xl">{lesson.title}</h1>
        {lesson.is_sample ? (
          <div className="mt-3">
            <Badge tone="sample">Sample content for testing. Not a real lesson.</Badge>
          </div>
        ) : null}
      </header>

      <section aria-label="Lesson video">
        {lesson.video_provider_id && lesson.captions_ready ? (
          <Alert tone="info" title="Video player">
            Private video playback connects in the next slice. The transcript below has the full lesson.
          </Alert>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-mauve bg-white p-6 text-center text-ink-muted">
            The video for this lesson is not available yet.
          </div>
        )}
      </section>

      {lesson.objective ? (
        <Card>
          <CardTitle className="text-xl">What you will do</CardTitle>
          <p className="mt-2">{lesson.objective}</p>
        </Card>
      ) : null}
      {lesson.assignment ? (
        <Card>
          <CardTitle className="text-xl">Your assignment</CardTitle>
          <p className="mt-2 whitespace-pre-line">{lesson.assignment}</p>
        </Card>
      ) : null}
      {lesson.transcript ? (
        <details className="rounded-2xl border border-rose bg-white p-6">
          <summary className="cursor-pointer font-semibold">Transcript</summary>
          <div className="mt-3 whitespace-pre-line text-sm leading-relaxed">{lesson.transcript}</div>
        </details>
      ) : null}
      {resources.length ? (
        <Card>
          <CardTitle className="text-xl">Downloads</CardTitle>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {resources.map((r) => (
              <li key={r.id}>{r.label} (secure download link arrives with file storage)</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-rose pt-6">
        <CompleteToggle lessonId={lesson.id} initiallyComplete={completed.has(lesson.id)} />
        {next ? (
          <ButtonLink href={`/app/training/${mod.slug}/${next.slug}`} variant="secondary">
            Next lesson
          </ButtonLink>
        ) : (
          <ButtonLink href="/app/training" variant="secondary">
            Back to all modules
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
