"use client";

import { Check, Download } from "lucide-react";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import {
  concreteFields,
  expandField,
  isRequired,
  labelFrom,
  renderSentence,
  worksheetProgress,
  type Answers,
  type AnswerValue,
  type ConcreteField,
  type RatingAnswer,
  type SentenceAnswer,
  type WorksheetField,
  type WorksheetSchema,
  type WorksheetSubsection,
} from "@/domain/worksheets/schema";
import { cn } from "@/lib/cn";
import { setWorksheetProgress } from "./progress-store";
import { useAutosave, type SaveFn, type SaveState } from "./use-autosave";

type CompleteFn = (input: { slug: string }) => Promise<{ ok: true; completedAt: string; milestone: boolean } | { ok: false; error: string }>;

export type WorksheetFormProps = {
  slug: string;
  schema: WorksheetSchema;
  initialAnswers: Answers;
  initialStatus: "in_progress" | "complete";
  initialSavedAt: string | null;
  lessonNumber: number;
  callbacks: Record<string, { label: string; text: string }>;
  /** display: read only render for staff (Slice D); edit: the member's own worksheet. */
  mode?: "edit" | "display";
  /** The lesson's module, for the "Download all Module N worksheets" button when the schema asks for it. */
  module?: { slug: string; number: number };
  save?: SaveFn;
  complete?: CompleteFn;
};

const inputCls =
  "w-full rounded-[14px] border-[1.5px] border-[rgba(101,71,79,0.18)] bg-[#FBF6F3] px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus:border-mauve disabled:opacity-80";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Renders any worksheet from its schema (brief: one component, no per worksheet components). */
export function WorksheetForm(props: WorksheetFormProps) {
  const { slug, schema, mode = "edit", lessonNumber } = props;
  const readOnly = mode === "display";
  const [answers, setAnswers] = useState<Answers>(props.initialAnswers);
  const [status, setStatus] = useState(props.initialStatus);
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);
  const [completing, startCompleting] = useTransition();
  const noopSave: SaveFn = async () => ({ ok: true, savedAt: new Date().toISOString() });
  const { state, queue, settle } = useAutosave(slug, props.save ?? noopSave, props.initialSavedAt);
  const progress = useMemo(() => worksheetProgress(schema, answers), [schema, answers]);
  // A look back worksheet (Lesson 9 placeholder) only quotes earlier answers: nothing to save or complete.
  const hasFields = useMemo(() => concreteFields(schema).length > 0, [schema]);

  useEffect(() => setWorksheetProgress(slug, progress.percent), [slug, progress.percent]);

  function update(key: string, value: AnswerValue) {
    if (readOnly) return;
    setAnswers((a) => ({ ...a, [key]: value }));
    queue(key, value);
  }

  function complete() {
    if (!props.complete) return;
    startCompleting(async () => {
      // Send any answers still waiting for the autosave pause, so the server checks the latest version.
      if (!(await settle())) {
        setCompleteMsg("Your latest answers have not saved yet. Check your connection and try again.");
        return;
      }
      const r = await props.complete!({ slug });
      if (r.ok) {
        setStatus("complete");
        setCompleteMsg(r.milestone && schema.completion.milestone_label ? `Milestone ticked: ${schema.completion.milestone_label}` : null);
      } else setCompleteMsg(r.error);
    });
  }

  const titleWords = schema.intro.title.trim().split(" ");
  const lastWord = titleWords.pop();

  return (
    <div className="worksheet">
      <header className="max-w-3xl">
        {schema.intro.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mauve-ink">{schema.intro.eyebrow}</p> : null}
        <h3 className="mt-3 font-display text-[2.2rem] font-medium leading-[1.1] sm:text-[2.7rem]">
          {titleWords.join(" ")} <em className="text-mauve">{lastWord}</em>
        </h3>
        {schema.intro.lead ? <p className="mt-4 text-lg leading-relaxed text-ink">{schema.intro.lead}</p> : null}
        {schema.intro.quote ? (
          <blockquote className="mt-6 border-l-2 border-rose-deep pl-5 font-display text-2xl italic leading-snug text-plum">{schema.intro.quote}</blockquote>
        ) : null}
        {schema.intro.notes?.length ? (
          <ul className="mt-6 space-y-3">
            {schema.intro.notes.map((n) => (
              <li key={n} className="rounded-[14px] bg-rose-soft/50 px-4 py-3 text-[0.95rem] leading-relaxed text-ink">{n}</li>
            ))}
          </ul>
        ) : null}
      </header>

      {schema.sections.map((section) => (
        <section key={section.key} aria-labelledby={`ws-${section.key}`} className="mt-[54px] border-t border-[rgba(101,71,79,0.12)] pt-[54px]">
          <div className={cn(section.number ? "grid gap-x-8 md:grid-cols-[80px_1fr]" : "")}>
            {section.number ? (
              <p aria-hidden className="font-display text-[4.5rem] leading-none text-rose-deep [font-variant-numeric:lining-nums]">{section.number}</p>
            ) : null}
            <div className="min-w-0">
              <SectionHead id={`ws-${section.key}`} title={section.title} ask={section.ask} guide={section.guide} number={section.number} />
              {props.callbacks[section.key] ? (
                <figure className="mt-6 rounded-[14px] border border-rose bg-white px-5 py-4" data-testid={`callback-${section.key}`}>
                  <figcaption className="text-xs font-semibold uppercase tracking-[0.16em] text-mauve-ink">From {props.callbacks[section.key]!.label}</figcaption>
                  <blockquote className="mt-2 font-display text-xl italic leading-snug text-plum">{props.callbacks[section.key]!.text}</blockquote>
                </figure>
              ) : section.callback && !readOnly ? (
                <p className="mt-6 rounded-[14px] border border-dashed border-rose bg-white/60 px-5 py-4 text-ink-muted" data-testid={`callback-${section.key}`}>
                  Your answer from {section.callback.label ?? "an earlier worksheet"} will show here once you fill it in.
                </p>
              ) : null}
              <FieldList fields={section.fields} schema={schema} answers={answers} update={update} readOnly={readOnly} context={section.title ?? ""} />
              {(section.subsections ?? []).map((sub) => (
                <Subsection key={sub.key} sub={sub} schema={schema} answers={answers} update={update} readOnly={readOnly} />
              ))}
              {section.footer ? <p className="mt-8 max-w-2xl font-display text-lg italic leading-snug text-mauve-ink">{section.footer}</p> : null}
            </div>
          </div>
        </section>
      ))}

      {!readOnly && !hasFields && schema.module_download && props.module ? (
        <div className="mt-[54px] border-t border-[rgba(101,71,79,0.12)] pt-8">
          <ModuleDownload module={props.module} />
        </div>
      ) : null}

      {!readOnly && hasFields ? (
        <div className="mt-[54px] border-t border-[rgba(101,71,79,0.12)] pt-8">
          {status === "complete" ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-plum px-5 py-2.5 font-semibold text-white">
              <Check className="size-4" aria-hidden />
              Lesson {lessonNumber} complete
            </p>
          ) : (
            <button
              type="button"
              onClick={complete}
              disabled={progress.percent < 100 || completing}
              className="min-h-11 rounded-full bg-plum px-6 font-semibold text-white hover:bg-plum-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {completing ? "Saving" : `Complete Lesson ${lessonNumber}`}
            </button>
          )}
          {status !== "complete" && progress.percent < 100 ? (
            <p className="mt-2 text-sm text-ink-muted">Answer the required questions to finish ({progress.done} of {progress.total} done). You can still change answers after you finish.</p>
          ) : status === "complete" ? (
            <p className="mt-2 text-sm text-ink-muted">You can keep editing. Changes save automatically.</p>
          ) : null}
          {completeMsg ? <p role="status" className="mt-2 text-sm font-medium text-plum">{completeMsg}</p> : null}
          <a
            href={`/api/worksheets/${slug}/pdf`}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-plum px-5 font-semibold text-plum hover:bg-rose-soft/50"
          >
            <Download className="size-4" aria-hidden />
            Download my worksheet
            <span className="sr-only"> (PDF)</span>
          </a>
          {schema.module_download && props.module ? <ModuleDownload module={props.module} className="ml-3" /> : null}
        </div>
      ) : null}

      {!readOnly && hasFields ? <StatusBar state={state} percent={progress.percent} /> : null}
    </div>
  );
}

function ModuleDownload({ module, className }: { module: { slug: string; number: number }; className?: string }) {
  return (
    <>
      <a
        href={`/api/worksheets/module/${module.slug}/pdf`}
        className={cn("mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-plum px-5 font-semibold text-plum hover:bg-rose-soft/50", className)}
      >
        <Download className="size-4" aria-hidden />
        Download all Module {module.number} worksheets
        <span className="sr-only"> (PDF)</span>
      </a>
      <p className="mt-2 text-sm text-ink-muted">Includes every Module {module.number} worksheet you have completed.</p>
    </>
  );
}

function StatusBar({ state, percent }: { state: SaveState; percent: number }) {
  const text =
    state.kind === "saving" ? "Saving" : state.kind === "saved" ? `Saved ${timeLabel(state.at)}` : state.kind === "retrying" ? state.message : state.kind === "error" ? state.message : "Your answers save as you type";
  return (
    <div className="sticky bottom-3 z-20 mt-10 flex flex-wrap items-center justify-between gap-3 rounded-full border border-rose bg-white/95 px-5 py-2.5 shadow-[0_10px_30px_-18px_rgba(101,71,79,0.6)] backdrop-blur">
      <p role="status" aria-live="polite" className={cn("text-sm font-medium", state.kind === "retrying" || state.kind === "error" ? "text-danger" : "text-ink-muted")} data-testid="worksheet-save-status">
        {text}
      </p>
      <div className="flex items-center gap-3">
        <div className="h-2 w-28 overflow-hidden rounded-full bg-rose-soft" aria-hidden>
          <div className="h-full rounded-full bg-plum transition-[width]" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-sm font-semibold text-plum" data-testid="worksheet-progress">{percent}% complete</p>
      </div>
    </div>
  );
}

function SectionHead({ id, title, ask, guide, number }: { id: string; title?: string; ask?: string; guide?: string; number?: string }) {
  if (!title && !ask && !guide) return null;
  return (
    <div className="max-w-2xl">
      {title ? (
        <h3 id={id} className="font-display text-[1.9rem] font-medium leading-tight">
          {number ? <span className="sr-only">Part {number}: </span> : null}
          {title}
        </h3>
      ) : null}
      {ask ? <p className="mt-1 font-display text-xl italic text-mauve-ink">{ask}</p> : null}
      {guide ? <p className="mt-3 leading-relaxed text-ink-muted">{guide}</p> : null}
    </div>
  );
}

type FieldCtx = { schema: WorksheetSchema; answers: Answers; update: (k: string, v: AnswerValue) => void; readOnly: boolean };

function FieldList({ fields, context, ...ctx }: FieldCtx & { fields: WorksheetField[]; context: string }) {
  if (!fields.length) return null;
  return (
    <div className="mt-8 space-y-8">
      {fields.map((f) => (f.repeat ? <RepeatGrid key={f.key} field={f} context={context} {...ctx} /> : <FieldView key={f.key} field={expandField(ctx.schema, f)[0]!} {...ctx} />))}
    </div>
  );
}

function Subsection({ sub, ...ctx }: FieldCtx & { sub: WorksheetSubsection }) {
  return (
    <div className="mt-12">
      <h4 className="font-display text-2xl font-medium">{sub.title}</h4>
      {sub.ask ? <p className="mt-1 font-display text-lg italic text-mauve-ink">{sub.ask}</p> : null}
      {sub.guide ? <p className="mt-2 max-w-2xl leading-relaxed text-ink-muted">{sub.guide}</p> : null}
      <FieldList fields={sub.fields} context={sub.title ?? sub.key} {...ctx} />
    </div>
  );
}

/** repeat: "ideas" renders the field once per key in a three column grid (stacks on mobile). */
function RepeatGrid({ field, context, ...ctx }: FieldCtx & { field: WorksheetField; context: string }) {
  const group = field.repeat ? ctx.schema.repeat_groups?.[field.repeat] : undefined;
  const concrete = expandField(ctx.schema, field);
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {concrete.map((c) => {
        const heading = labelFrom(group?.label_from, c.repeatKey!, ctx.answers);
        return (
          <div key={c.key} className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-mauve-ink" data-testid={`col-${c.key}`}>
              {heading}
              {isRequired(c) ? <span className="ml-1 normal-case tracking-normal text-ink-muted">(required)</span> : null}
            </p>
            <FieldView field={c} {...ctx} ariaLabel={`${context} for ${heading}`} hideLabel />
          </div>
        );
      })}
    </div>
  );
}

function Label({ field, htmlFor, hide }: { field: ConcreteField; htmlFor: string; hide?: boolean }) {
  if (hide || !field.label) return null;
  return (
    <label htmlFor={htmlFor} className="block font-semibold text-ink">
      {field.label}
      {isRequired(field) ? <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">Required</span> : null}
    </label>
  );
}

function Help({ field }: { field: ConcreteField }) {
  return (
    <>
      {field.guide ? <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-muted">{field.guide}</p> : null}
      {field.example ? <p className="mt-1 text-sm italic text-mauve-ink">Hypothetical example: {field.example}</p> : null}
    </>
  );
}

function FieldView({ field, ariaLabel, hideLabel, ...ctx }: FieldCtx & { field: ConcreteField; ariaLabel?: string; hideLabel?: boolean }) {
  const id = useId();
  const value = ctx.answers[field.key];
  const common = { id, disabled: ctx.readOnly, "aria-label": hideLabel ? ariaLabel : undefined, "data-field": field.key } as const;
  switch (field.type) {
    case "text":
    case "date":
      return (
        <div className="max-w-2xl">
          <Label field={field} htmlFor={id} hide={hideLabel} />
          <Help field={field} />
          <input
            {...common}
            type={field.type === "date" ? "date" : "text"}
            className={cn(inputCls, "mt-2 min-h-12", field.type === "date" && "max-w-xs")}
            value={typeof value === "string" ? value : ""}
            maxLength={field.max_length}
            placeholder={field.placeholder}
            onChange={(e) => ctx.update(field.key, e.target.value)}
          />
        </div>
      );
    case "textarea":
      return (
        <div className="max-w-2xl">
          <Label field={field} htmlFor={id} hide={hideLabel} />
          <Help field={field} />
          <textarea
            {...common}
            className={cn(inputCls, "mt-2 min-h-32 leading-relaxed")}
            value={typeof value === "string" ? value : ""}
            maxLength={field.max_length}
            placeholder={field.placeholder}
            onChange={(e) => ctx.update(field.key, e.target.value)}
          />
        </div>
      );
    case "rating":
      return <RatingField field={field} value={value as RatingAnswer | undefined} ariaLabel={ariaLabel} hideLabel={hideLabel} {...ctx} />;
    case "choice":
      return <ChoiceField field={field} value={typeof value === "string" ? value : ""} {...ctx} />;
    case "sentence":
      return <SentenceField field={field} value={(value as SentenceAnswer | undefined) ?? {}} {...ctx} />;
  }
}

const RATING_STYLE: Record<string, { on: string; off: string }> = {
  strong: { on: "border-plum bg-plum text-white", off: "border-[rgba(101,71,79,0.25)] bg-white text-ink" },
  uncertain: { on: "border-rose bg-rose text-ink", off: "border-[rgba(101,71,79,0.25)] bg-white text-ink" },
  weak: { on: "border-mauve bg-white italic text-mauve-ink ring-1 ring-mauve", off: "border-[rgba(101,71,79,0.25)] bg-white italic text-ink" },
};

function RatingField({ field, value, ariaLabel, hideLabel, ...ctx }: FieldCtx & { field: Extract<ConcreteField, { type: "rating" }>; value: RatingAnswer | undefined; ariaLabel?: string; hideLabel?: boolean }) {
  const noteId = useId();
  const options = ctx.schema.rating_options ?? [];
  const current: RatingAnswer = { rating: value?.rating ?? null, note: value?.note ?? "" };
  const groupLabel = ariaLabel ?? field.label ?? field.key;
  return (
    <div>
      {!hideLabel && field.label ? <p className="font-semibold">{field.label}</p> : null}
      <div role="radiogroup" aria-label={groupLabel} className="flex flex-wrap gap-2" data-field={field.key}>
        {options.map((o) => {
          const on = current.rating === o.value;
          const style = RATING_STYLE[o.value] ?? RATING_STYLE.strong!;
          return (
            <label
              key={o.value}
              title={o.guide}
              className={cn("inline-flex min-h-10 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-plum", on ? style.on : style.off, ctx.readOnly && "cursor-default")}
            >
              <input
                type="radio"
                className="sr-only"
                name={`${field.key}-rating`}
                value={o.value}
                checked={on}
                disabled={ctx.readOnly}
                onChange={() => ctx.update(field.key, { ...current, rating: o.value })}
              />
              {o.label}
            </label>
          );
        })}
      </div>
      <label htmlFor={noteId} className="sr-only">
        Why, for {groupLabel}
      </label>
      <textarea
        id={noteId}
        disabled={ctx.readOnly}
        className={cn(inputCls, "mt-3 min-h-24 text-[0.95rem] leading-relaxed")}
        placeholder={field.note_required ? "Why? One sentence." : "Why? (optional)"}
        maxLength={field.max_length}
        value={current.note}
        onChange={(e) => ctx.update(field.key, { ...current, note: e.target.value })}
      />
    </div>
  );
}

function ChoiceField({ field, value, ...ctx }: FieldCtx & { field: Extract<ConcreteField, { type: "choice" }>; value: string }) {
  return (
    <div>
      <p className="font-semibold">
        {field.label}
        {isRequired(field) ? <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">Required</span> : null}
      </p>
      <div role="radiogroup" aria-label={field.label ?? field.key} className="mt-3 flex flex-wrap gap-2" data-field={field.key}>
        {field.options.map((opt) => {
          const label = field.option_label_from ? labelFrom(field.option_label_from, opt, ctx.answers) : opt;
          const named = !field.option_label_from || label !== `Idea ${opt}`;
          const on = value === opt;
          return (
            <label
              key={opt}
              className={cn(
                "inline-flex min-h-10 max-w-full cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-plum",
                on ? "border-plum bg-plum text-white" : "border-[rgba(101,71,79,0.25)] bg-white text-ink",
                (!named || ctx.readOnly) && "cursor-not-allowed opacity-60",
              )}
            >
              <input type="radio" className="sr-only" name={field.key} value={opt} checked={on} disabled={ctx.readOnly || !named} onChange={() => ctx.update(field.key, opt)} />
              <span className="truncate">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SentenceField({ field, value, ...ctx }: FieldCtx & { field: Extract<ConcreteField, { type: "sentence" }>; value: SentenceAnswer }) {
  const parts = field.template.split(/(\{[a-z0-9_]+\})/g).filter(Boolean);
  function set(slot: string, v: string) {
    const next: Record<string, string> = {};
    for (const s of field.slots) next[s.key] = s.key === slot ? v : (value[s.key] ?? "");
    ctx.update(field.key, { ...next, _rendered: renderSentence(field.template, next) });
  }
  return (
    <div>
      <p className="font-semibold">
        {field.label}
        {isRequired(field) ? <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">Required</span> : null}
      </p>
      <p className="mt-3 font-display text-[1.7rem] leading-[2.1] text-plum sm:text-[2rem]" data-field={field.key}>
        {parts.map((p, i) => {
          const m = p.match(/^\{([a-z0-9_]+)\}$/);
          if (!m) return <span key={i}>{p}</span>;
          const slot = field.slots.find((s) => s.key === m[1]);
          if (!slot) return <span key={i}>{p}</span>;
          const v = value[slot.key] ?? "";
          return (
            <input
              key={i}
              aria-label={`${field.label ?? "Sentence"}: ${slot.placeholder ?? slot.key}`}
              disabled={ctx.readOnly}
              className="mx-1 inline-block max-w-full rounded-lg border-b-[1.5px] border-mauve bg-[#FBF6F3] px-2 align-baseline font-display italic text-plum placeholder:text-mauve/70"
              size={Math.max((slot.placeholder ?? slot.key).length, v.length) + 1}
              maxLength={slot.max_length}
              placeholder={slot.placeholder ?? slot.key}
              value={v}
              onChange={(e) => set(slot.key, e.target.value)}
            />
          );
        })}
      </p>
    </div>
  );
}
