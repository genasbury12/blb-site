"use client";

import { useState, useTransition } from "react";
import { setRoadmapItemDone } from "@/app/app/actions";

export function RoadmapItemToggle({ itemId, title, initiallyDone }: { itemId: string; title: string; initiallyDone: boolean }) {
  const [done, setDone] = useState(initiallyDone);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const id = `roadmap-${itemId}`;
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-1 size-5 accent-plum"
          checked={done}
          disabled={pending}
          onChange={(e) =>
            start(async () => {
              const target = e.target.checked;
              const r = await setRoadmapItemDone({ itemId, done: target });
              if (r.ok) {
                setDone(target);
                setError(null);
              } else setError(r.error);
            })
          }
        />
        <span className={done ? "text-ink-muted line-through" : ""}>{title}</span>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
