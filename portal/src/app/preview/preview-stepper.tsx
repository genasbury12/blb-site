"use client";

import { AuditStepper } from "@/components/audit/audit-stepper";
import type { AnswerKey } from "@/domain/audit/types";
import { AUDIT_V1, SECTION_INTROS } from "@/domain/audit/v1";

const ok = async () => ({ ok: true as const, savedAt: new Date().toISOString() });

/** Preview only: saves are simulated locally and never reach the server. */
export function PreviewStepper({ initialAnswers, initialQuestion }: { initialAnswers: Record<string, AnswerKey>; initialQuestion: number }) {
  return (
    <AuditStepper
      questions={AUDIT_V1.questions}
      sectionIntros={SECTION_INTROS}
      initialAnswers={initialAnswers}
      initialQuestion={initialQuestion}
      actions={{ saveAnswer: ok, savePosition: ok, submit: async () => ({ ok: false, error: "Preview only. Nothing is submitted." }) }}
    />
  );
}
