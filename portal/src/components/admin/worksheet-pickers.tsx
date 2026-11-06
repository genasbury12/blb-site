"use client";

import { AlertTriangle } from "lucide-react";
import { useId, useState } from "react";
import type { ModuleLessons, WorksheetOption } from "@/lib/server/worksheets-admin";
import { Field, Select } from "./fields";

function Warning({ id, lines }: { id: string; lines: string[] }) {
  return (
    <div id={id} aria-live="polite" data-testid="attach-warning">
      {lines.length ? (
        <p className="mt-2 flex gap-2 rounded-xl bg-rose-soft/70 px-3 py-2 text-sm text-ink">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-mauve-ink" aria-hidden />
          <span>{lines.join(" ")}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Lesson edit page: which worksheet this lesson carries. One worksheet per lesson, so choosing one that sits on
 * another lesson moves it here, and choosing a different one (or None) detaches the current one. Says so before saving.
 */
export function WorksheetPicker({ lessonId, current, options }: { lessonId: string; current: WorksheetOption | null; options: WorksheetOption[] }) {
  const [value, setValue] = useState(current?.slug ?? "");
  const warnId = useId();
  const chosen = options.find((o) => o.slug === value);
  const lines: string[] = [];
  if (chosen && chosen.lessonId && chosen.lessonId !== lessonId) lines.push(`This will remove it from "${titleOf(chosen.lessonLabel)}".`);
  if (current && current.slug !== value) lines.push(value ? `"${current.title}" will be detached from this lesson.` : `"${current.title}" will be detached from this lesson and attached to nothing.`);
  return (
    <Field label="Worksheet" hint="One worksheet per lesson. Members see it once both the worksheet and this lesson are published." htmlFor="worksheet_slug">
      <Select id="worksheet_slug" name="worksheet_slug" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby={warnId}>
        <option value="">None</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.title} ({o.lessonId === lessonId ? "this lesson" : o.lessonLabel ? `on ${o.lessonLabel}` : "not attached"})
          </option>
        ))}
      </Select>
      <Warning id={warnId} lines={lines} />
    </Field>
  );
}

/** "Module 1, Lesson 3: Customer research" back to "Customer research", for the warning line. */
function titleOf(label: string | null) {
  return label?.replace(/^Module \d+, Lesson \d+: /, "") ?? "";
}

/**
 * Worksheet page (and New worksheet): which lesson this worksheet is attached to, grouped by module. Moving it says
 * which lesson it leaves and which worksheet the new lesson gives up.
 */
export function LessonPicker({ slug, currentLessonId, modules, label = "Attached to lesson" }: { slug: string | null; currentLessonId: string | null; modules: ModuleLessons[]; label?: string }) {
  const [value, setValue] = useState(currentLessonId ?? "");
  const warnId = useId();
  const all = modules.flatMap((m) => m.lessons);
  const current = all.find((l) => l.id === currentLessonId);
  const target = all.find((l) => l.id === value);
  const lines: string[] = [];
  if (current && current.id !== value) lines.push(value ? `This will remove it from "${current.title}".` : `This will remove it from "${current.title}". Members will not see it on any lesson.`);
  if (target && target.worksheetSlug && target.worksheetSlug !== slug) lines.push(`"${target.worksheetTitle}" will be detached from "${target.title}".`);
  return (
    <Field label={label} hint="One worksheet per lesson. Members see it once both the worksheet and its lesson are published." htmlFor="lesson_id">
      <Select id="lesson_id" name="lesson_id" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby={warnId}>
        <option value="">Not attached</option>
        {modules.map((m) => (
          <optgroup key={m.id} label={`Module ${m.number}: ${m.title}`}>
            {m.lessons.map((l) => (
              <option key={l.id} value={l.id}>
                Lesson {l.orderIndex}: {l.title}
                {l.worksheetSlug && l.worksheetSlug !== slug ? ` (has ${l.worksheetTitle})` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <Warning id={warnId} lines={lines} />
    </Field>
  );
}
