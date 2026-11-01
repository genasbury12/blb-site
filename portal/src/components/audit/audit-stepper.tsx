"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { saveAuditAnswer, saveAuditPosition, submitAudit } from "@/app/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { CATEGORIES, CATEGORY_LABELS, type AnswerKey, type AuditQuestion, type Category } from "@/domain/audit/types";
import { cn } from "@/lib/cn";

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string; retry: { code: string; value: AnswerKey; position: number } };

type StepperActions = {
  saveAnswer: typeof saveAuditAnswer;
  savePosition: typeof saveAuditPosition;
  submit: typeof submitAudit;
};

const SERVER_ACTIONS: StepperActions = { saveAnswer: saveAuditAnswer, savePosition: saveAuditPosition, submit: submitAudit };

export function AuditStepper({
  questions,
  sectionIntros,
  initialAnswers,
  initialQuestion,
  actions = SERVER_ACTIONS,
}: {
  questions: AuditQuestion[];
  sectionIntros: Record<Category, string>;
  initialAnswers: Record<string, AnswerKey>;
  initialQuestion: number;
  actions?: StepperActions;
}) {
  const total = questions.length;
  const [answers, setAnswers] = useState<Record<string, AnswerKey>>(initialAnswers);
  const [index, setIndex] = useState(() => Math.min(Math.max(initialQuestion, 1), total + 1) - 1);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const firstRender = useRef(true);

  const reviewing = index >= total;
  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const sectionNumber = question ? CATEGORIES.indexOf(question.category) + 1 : CATEGORIES.length;
  const firstOfSection = question ? questions.find((q) => q.category === question.category)?.code === question.code : false;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  // Saves run one at a time so a quick series of answers cannot overwrite each other.
  const persist = useCallback((code: string, value: AnswerKey, position: number) => {
    const run = () => {
      setSave({ kind: "saving" });
      return actions.saveAnswer({ code, value, currentQuestion: position }).then((r) => {
        if (r.ok) setSave({ kind: "saved" });
        else setSave({ kind: "error", message: r.error, retry: { code, value, position } });
      });
    };
    queue.current = queue.current.then(run, run);
  }, [actions]);

  function choose(value: AnswerKey) {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.code]: value }));
    persist(question.code, value, Math.min(index + 2, total));
  }

  function go(to: number) {
    setIndex(to);
    if (to < total) {
      queue.current = queue.current.then(() => actions.savePosition({ currentQuestion: to + 1 }));
    }
  }

  const missing = questions.filter((q) => !answers[q.code]);

  return (
    <div className="space-y-6">
      <ProgressBar value={(answeredCount / total) * 100} label={`${answeredCount} of ${total} questions answered`} />
      <div aria-live="polite" className="min-h-6 text-sm text-ink-muted">
        {save.kind === "saving" ? "Saving" : save.kind === "saved" ? "Saved" : null}
      </div>
      {save.kind === "error" ? (
        <Alert tone="danger" title="That answer was not saved">
          {save.message}{" "}
          <button type="button" className="font-semibold underline" onClick={() => persist(save.retry.code, save.retry.value, save.retry.position)}>
            Try again
          </button>
        </Alert>
      ) : null}

      {!reviewing && question ? (
        <section aria-labelledby="question-heading" className="rounded-2xl border border-rose bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Section {sectionNumber} of {CATEGORIES.length}: {CATEGORY_LABELS[question.category]}
          </p>
          {firstOfSection ? <p className="mt-1 text-sm text-ink-muted">{sectionIntros[question.category]}</p> : null}
          <fieldset className="mt-4">
            <legend className="w-full">
              <h2 id="question-heading" ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
                <span className="sr-only">Question {index + 1} of {total}. </span>
                {question.prompt}
              </h2>
            </legend>
            <div className="mt-5 grid gap-3">
              {question.options.map((opt) => {
                const id = `${question.code}-${opt.key}`;
                const checked = answers[question.code] === opt.key;
                return (
                  <label
                    key={opt.key}
                    htmlFor={id}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-plum",
                      checked ? "border-plum bg-rose-soft" : "border-mauve bg-white hover:bg-rose-soft",
                    )}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={question.code}
                      value={opt.key}
                      checked={checked}
                      onChange={() => choose(opt.key)}
                      className="size-5 accent-plum"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
              Back
            </Button>
            <p className="text-sm text-ink-muted" aria-hidden>
              Question {index + 1} of {total}
            </p>
            <Button type="button" onClick={() => go(index + 1)} disabled={!answers[question.code]}>
              {index + 1 === total ? "Review answers" : "Next"}
            </Button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="review-heading" className="rounded-2xl border border-rose bg-white p-6">
          <h2 id="review-heading" ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
            Review and submit
          </h2>
          {missing.length ? (
            <>
              <p className="mt-2">Every question needs an answer before you submit. These are still open:</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {missing.map((q) => (
                  <li key={q.code}>
                    <Button type="button" variant="secondary" size="sm" onClick={() => go(questions.indexOf(q))}>
                      Question {q.number}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2">All {total} questions are answered. Your results are based on what you shared about your business today.</p>
          )}
          {submitError ? (
            <Alert tone="danger" className="mt-4">
              {submitError}
            </Alert>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => go(total - 1)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={missing.length > 0 || submitting}
              onClick={() =>
                startSubmit(async () => {
                  await queue.current;
                  const r = await actions.submit();
                  if (r && !r.ok) setSubmitError(r.error);
                })
              }
            >
              {submitting ? "Calculating your results" : "Submit my audit"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
