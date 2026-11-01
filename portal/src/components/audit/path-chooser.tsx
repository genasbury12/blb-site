"use client";

import { useState, useTransition } from "react";
import { choosePath } from "@/app/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { LearningPath } from "@/domain/audit/types";

const OPTIONS: { value: LearningPath; label: string; body: string }[] = [
  { value: "build_from_scratch", label: "Build From Scratch", body: "Create the core pieces in order: offer, website, product, email, and sales." },
  { value: "optimize_automate", label: "Optimize & Automate", body: "Improve and connect what you already have, then automate the repetitive work." },
];

export function PathChooser({ runId, current }: { runId: string; current: LearningPath }) {
  const [selected, setSelected] = useState<LearningPath>(current);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await choosePath({ runId, path: selected, reason: reason || undefined });
          setStatus(r.ok ? { ok: true, text: "Your path is updated. Your answers and scores have not changed." } : { ok: false, text: r.error });
        });
      }}
    >
      <fieldset>
        <legend className="font-semibold">Choose the path that fits you</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((o) => (
            <label key={o.value} className="flex cursor-pointer gap-3 rounded-xl border border-mauve bg-white p-4 has-[:checked]:border-plum has-[:checked]:bg-rose-soft">
              <input type="radio" name="path" value={o.value} checked={selected === o.value} onChange={() => setSelected(o.value)} className="mt-1 size-5 accent-plum" />
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-sm text-ink-muted">{o.body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="path-reason" className="block text-sm font-semibold">
          Why this path? (optional)
        </label>
        <textarea
          id="path-reason"
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 block min-h-20 w-full rounded-lg border border-mauve bg-white p-3"
        />
      </div>
      <div aria-live="polite">{status ? <Alert tone={status.ok ? "success" : "danger"}>{status.text}</Alert> : null}</div>
      <Button type="submit" variant="secondary" disabled={pending || selected === current}>
        {pending ? "Saving" : "Save my path"}
      </Button>
    </form>
  );
}
