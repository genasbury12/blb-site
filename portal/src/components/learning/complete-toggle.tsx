"use client";

import { useState, useTransition } from "react";
import { setLessonComplete } from "@/app/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CompleteToggle({ lessonId, initiallyComplete }: { lessonId: string; initiallyComplete: boolean }) {
  const [complete, setComplete] = useState(initiallyComplete);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={complete ? "secondary" : "primary"}
        aria-pressed={complete}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const target = !complete;
            const r = await setLessonComplete({ lessonId, complete: target });
            if (r.ok) {
              setComplete(target);
              setError(null);
            } else setError(r.error);
          })
        }
      >
        {pending ? "Saving" : complete ? "Completed. Mark as not done" : "Mark lesson complete"}
      </Button>
      <div aria-live="polite">{error ? <Alert tone="danger">{error}</Alert> : null}</div>
    </div>
  );
}
