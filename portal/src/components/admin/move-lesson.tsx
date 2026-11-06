"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useActionState } from "react";
import { moveLesson } from "@/app/admin/catalog/actions";
import type { FormState } from "@/lib/server/form-result";

/** Up and down arrows on the Curriculum page: swaps the lesson with its neighbour in one database transaction. */
export function MoveLessonButtons({ id, title, first, last }: { id: string; title: string; first: boolean; last: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(moveLesson, null);
  const btn =
    "inline-flex size-9 items-center justify-center rounded-full border border-rose text-plum hover:bg-rose-soft/60 disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <span className="inline-flex items-center gap-1">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="up" />
        <button type="submit" className={btn} disabled={first || pending} aria-label={`Move ${title} up`} data-testid={`up-${id}`}>
          <ArrowUp className="size-4" aria-hidden />
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="direction" value="down" />
        <button type="submit" className={btn} disabled={last || pending} aria-label={`Move ${title} down`} data-testid={`down-${id}`}>
          <ArrowDown className="size-4" aria-hidden />
        </button>
      </form>
      {state && !state.ok ? (
        <span role="status" className="text-sm text-danger">
          {state.error}
        </span>
      ) : null}
    </span>
  );
}
