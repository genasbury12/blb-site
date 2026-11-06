"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { deleteAllSampleLessons, deleteLesson } from "@/app/admin/catalog/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/server/form-result";

export type DeletePreview = {
  title: string;
  isSample: boolean;
  progress: number;
  answers: number;
  resources: number;
  suggestions: number;
  worksheets: { slug: string; title: string }[];
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Delete next to Archive on the lesson page. A sample lesson, or one no member has touched, needs one confirm. A real
 * lesson with member progress or worksheet answers needs its title typed (the database checks it too), and the dialog
 * offers the answers as CSV first. The worksheet is detached and kept, with its answers.
 */
export function DeleteLessonButton({ id, preview }: { id: string; preview: DeletePreview }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(deleteLesson, null);
  const hasMemberData = preview.progress > 0 || preview.answers > 0;
  const mustType = !preview.isSample && hasMemberData;
  const canDelete = !mustType || typed === preview.title;
  return (
    <>
      <Button type="button" variant="secondary" onClick={() => dialog.current?.showModal()} data-testid="delete-lesson">
        <Trash2 className="size-4" aria-hidden />
        Delete
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-lesson-title"
        className="m-auto w-[min(92vw,34rem)] rounded-[22px] border border-rose bg-white p-0 text-ink shadow-[0_30px_80px_-30px_rgba(101,71,79,0.6)] backdrop:bg-plum/40"
      >
        <form action={action} className="space-y-4 p-6">
          <input type="hidden" name="id" value={id} />
          <h2 id="delete-lesson-title" className="font-display text-2xl">
            Delete this lesson?
          </h2>
          <p className="font-semibold">{preview.title}</p>
          <ul className="space-y-1 text-sm text-ink" data-testid="delete-counts">
            <li>{plural(preview.progress, "member has", "members have")} progress on it.</li>
            <li>{plural(preview.answers, "worksheet answer is", "worksheet answers are")} tied to it.</li>
            {preview.resources ? <li>{plural(preview.resources, "download", "downloads")} will be deleted.</li> : null}
            {preview.suggestions ? <li>{plural(preview.suggestions, "suggestion", "suggestions")} will be deleted.</li> : null}
          </ul>
          <p className="text-sm text-ink-muted">
            This deletes the lesson for good and frees its position. Members&apos; progress on it is removed.
            {preview.worksheets.length
              ? ` Its worksheet (${preview.worksheets.map((w) => `"${w.title}"`).join(", ")}) is detached, not deleted: it and every answer stay, ready to attach to another lesson.`
              : ""}{" "}
            To hide a lesson but keep everything, use Archive instead.
          </p>
          {preview.answers > 0
            ? preview.worksheets.map((w) => (
                <a key={w.slug} href={`/api/admin/worksheets/${w.slug}/csv`} className="inline-flex text-sm font-semibold text-plum underline underline-offset-4">
                  Export answers as CSV first ({w.title})
                </a>
              ))
            : null}
          {mustType ? (
            <div>
              <label htmlFor="confirm_title" className="block text-sm font-semibold">
                Members have data on this lesson. Type its title to confirm.
              </label>
              <input
                id="confirm_title"
                name="confirm_title"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-1 block min-h-11 w-full rounded-xl border border-mauve bg-white px-3 text-base"
              />
            </div>
          ) : null}
          <div aria-live="polite">{state && !state.ok ? <Alert tone="danger">{state.error}</Alert> : null}</div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!canDelete || pending}>
              {pending ? "Deleting" : "Delete lesson"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => dialog.current?.close()}>
              Cancel
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** Curriculum page: delete every sample lesson in one confirm. Their worksheets are detached first and listed. */
export function DeleteSampleLessonsButton({ count }: { count: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAllSampleLessons, null);
  if (!count) return null;
  return (
    <>
      <Button type="button" variant="secondary" onClick={() => dialog.current?.showModal()} data-testid="delete-samples">
        <Trash2 className="size-4" aria-hidden />
        Delete all sample lessons
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="delete-samples-title"
        className="m-auto w-[min(92vw,32rem)] rounded-[22px] border border-rose bg-white p-0 text-ink shadow-[0_30px_80px_-30px_rgba(101,71,79,0.6)] backdrop:bg-plum/40"
      >
        <form action={action} className="space-y-4 p-6">
          <input type="hidden" name="confirm" value="yes" />
          <h2 id="delete-samples-title" className="font-display text-2xl">
            Delete {plural(count, "sample lesson", "sample lessons")}?
          </h2>
          <p className="text-sm text-ink-muted">
            Every lesson marked Sample, in every module, is deleted for good with its test progress. Worksheets on them are detached first and kept, with their answers;
            the next page lists them.
          </p>
          <div aria-live="polite">{state ? <Alert tone={state.ok ? "success" : "danger"}>{state.ok ? state.message : state.error}</Alert> : null}</div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Deleting" : "Delete sample lessons"}</Button>
            <Button type="button" variant="secondary" onClick={() => dialog.current?.close()}>
              Cancel
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
