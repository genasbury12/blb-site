"use client";

import { Check, Download } from "lucide-react";
import { Fragment, useEffect, useId, useMemo, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { decisionCards, groupTopCallbacks, type DecisionCard, type InlineCallback, type ResolvedTopCallback } from "@/domain/worksheets/callbacks";
import {
  choiceOptions,
  concreteFields,
  expandField,
  groupHeading,
  isRequired,
  labelFrom,
  renderSentence,
  multichoiceValues,
  repeatOptions,
  visibleRows,
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
  /** Quotes before section 1, e.g. Lesson 3 "Where you started" (or its missing_text). */
  topCallbacks?: ResolvedTopCallback[];
  /** Quotes inside a section (callbacks_inline), keyed by section key. */
  inlineCallbacks?: Record<string, InlineCallback[]>;
  /** Empty fields started from earlier answers (prefill_from). Shown and saved as the member's own answer. */
  prefill?: Answers;
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
  const [answers, setAnswers] = useState<Answers>(() => ({ ...props.initialAnswers, ...(readOnly ? {} : props.prefill) }));
  const [status, setStatus] = useState(props.initialStatus);
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);
  const [completing, startCompleting] = useTransition();
  const noopSave: SaveFn = async () => ({ ok: true, savedAt: new Date().toISOString() });
  const { state, queue, settle } = useAutosave(slug, props.save ?? noopSave, props.initialSavedAt);
  const progress = useMemo(() => worksheetProgress(schema, answers), [schema, answers]);
  // A look back worksheet (Lesson 9 placeholder) only quotes earlier answers: nothing to save or complete.
  const hasFields = useMemo(() => concreteFields(schema).length > 0, [schema]);
  // "Download all Module N worksheets": the Lesson 9 placeholder's module_download, or the Blueprint's pdf block.
  const hasBundle = Boolean(schema.module_download || schema.pdf?.bundle_label);

  useEffect(() => setWorksheetProgress(slug, progress.percent), [slug, progress.percent]);

  // Copied-forward answers are saved straight away, so progress and Complete agree with what the server holds.
  const prefillSaved = useRef(false);
  useEffect(() => {
    if (readOnly || prefillSaved.current || !props.prefill) return;
    prefillSaved.current = true;
    for (const [k, v] of Object.entries(props.prefill)) queue(k, v);
  }, [readOnly, props.prefill, queue]);

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

      {!readOnly && props.topCallbacks?.length && !schema.callback_layout ? (
        <section aria-label={props.topCallbacks[0]!.heading} className="mt-[54px] border-t border-[rgba(101,71,79,0.12)] pt-[54px]">
          <div className="grid gap-x-8 md:grid-cols-[80px_1fr]">
            <div aria-hidden className="hidden md:block" />
            <div className="min-w-0 max-w-2xl space-y-4">
              {groupTopCallbacks(props.topCallbacks).map((g) => (
                <CallbackQuote key={g.key} testId={`callback-${g.key}`} caption={g.heading} lines={g.lines} missing={g.missingText} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {schema.sections.map((section, si) => (
        <section key={section.key} aria-labelledby={`ws-${section.key}`} className="mt-[54px] border-t border-[rgba(101,71,79,0.12)] pt-[54px]" data-testid={`section-${section.key}`}>
          <div className={cn(section.number ? "grid gap-x-8 md:grid-cols-[80px_1fr]" : "")}>
            {section.number ? (
              <p aria-hidden className="font-display text-[4.5rem] leading-none text-rose-deep [font-variant-numeric:lining-nums]">{section.number}</p>
            ) : null}
            <div className="min-w-0">
              <SectionHead id={`ws-${section.key}`} title={section.title} ask={section.ask} guide={section.guide} number={section.number} />
              {props.callbacks[section.key] || (section.callback && !readOnly) ? (
                <div className="mt-6">
                  <CallbackQuote
                    testId={`callback-${section.key}`}
                    caption={`From ${props.callbacks[section.key]?.label ?? section.callback?.label ?? ""}`}
                    lines={props.callbacks[section.key] ? [props.callbacks[section.key]!.text] : []}
                    missing={`Your answer from ${section.callback?.label ?? "an earlier worksheet"} will show here once you fill it in.`}
                  />
                </div>
              ) : null}
              {props.inlineCallbacks?.[section.key]?.length ? (
                <div className="mt-6 max-w-2xl space-y-3">
                  {props.inlineCallbacks[section.key]!.map((cb) => (
                    <CallbackQuote key={cb.key} testId={`inline-${cb.key}`} caption={cb.heading} lines={cb.text ? [cb.text] : []} missing={`Your answer from ${cb.source} will show here once you fill it in.`} />
                  ))}
                </div>
              ) : null}
              <OptionalSection section={section} answers={answers}>
                {si === 0 && schema.callback_layout ? (
                  <DecisionCards
                    cards={decisionCards(props.topCallbacks ?? (schema.callbacks ?? []).map((c) => ({ key: c.key, heading: c.heading, text: null, missingText: c.missing_text })))}
                    fields={section.fields}
                    schema={schema}
                    answers={answers}
                    update={update}
                    readOnly={readOnly}
                  />
                ) : (
                  <FieldList fields={section.fields} schema={schema} answers={answers} update={update} readOnly={readOnly} context={section.title ?? ""} />
                )}
              </OptionalSection>
              {matrixGroup(schema, section.subsections) ? (
                <RepeatMatrix subs={section.subsections!} group={matrixGroup(schema, section.subsections)!} schema={schema} answers={answers} update={update} readOnly={readOnly} />
              ) : (
                (section.subsections ?? []).map((sub) => <Subsection key={sub.key} sub={sub} schema={schema} answers={answers} update={update} readOnly={readOnly} />)
              )}
              {section.footer ? <p className="mt-8 max-w-2xl font-display text-lg italic leading-snug text-mauve-ink">{section.footer}</p> : null}
            </div>
          </div>
        </section>
      ))}

      {!readOnly && !hasFields && hasBundle && props.module ? (
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
          {hasBundle && props.module ? <ModuleDownload module={props.module} className="ml-3" /> : null}
        </div>
      ) : null}

      {!readOnly && hasFields ? <StatusBar state={state} percent={progress.percent} /> : null}
    </div>
  );
}

/** Quotes from the member's earlier worksheets, or a dashed note while they are not there yet (Lessons 3 to 9). */
function CallbackQuote({ testId, caption, lines, missing }: { testId: string; caption: string; lines: string[]; missing: string }) {
  if (!lines.length)
    return missing ? (
      <p className="rounded-[14px] border border-dashed border-rose bg-white/60 px-5 py-4 text-ink-muted" data-testid={testId}>
        {missing}
      </p>
    ) : null;
  return (
    <figure className="rounded-[14px] border border-rose bg-white px-5 py-4" data-testid={testId}>
      {caption ? <figcaption className="text-xs font-semibold uppercase tracking-[0.16em] text-mauve-ink">{caption}</figcaption> : null}
      <blockquote className="mt-2 space-y-2 font-display text-xl italic leading-snug text-plum">
        {lines.map((l) => (
          <p key={l}>{l}</p>
        ))}
      </blockquote>
    </figure>
  );
}

/** optional: true sections (Lesson 9 section 2) start closed unless already answered; not needed to finish. */
function OptionalSection({ section, answers, children }: { section: WorksheetSchema["sections"][number]; answers: Answers; children: ReactNode }) {
  const keys = section.fields.map((f) => f.key);
  const [open, setOpen] = useState(() => keys.some((k) => typeof answers[k] === "string" && (answers[k] as string).trim()));
  const id = useId();
  if (!section.optional) return <>{children}</>;
  return (
    <div className="mt-6">
      <p className="text-sm text-ink-muted">Optional. You can finish the worksheet without it.</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="mt-2 inline-flex min-h-11 items-center rounded-full border border-plum px-5 font-semibold text-plum hover:bg-rose-soft/50"
        data-testid={`toggle-${section.key}`}
      >
        {open ? "Hide" : "Show"}
        <span className="sr-only"> {section.title}</span>
      </button>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </div>
  );
}

/**
 * callback_layout (Lesson 9): one card per decision. The quoted answer on top (plus any second quote such as the
 * decision rule), then that decision's fields: dec_n, ev_n, note_n. Fields not tied to a card follow.
 */
function DecisionCards({ cards, fields, ...ctx }: FieldCtx & { cards: DecisionCard[]; fields: WorksheetField[] }) {
  const inCard = (n: string) => fields.filter((f) => new RegExp(`_${n}$`).test(f.key));
  const rest = fields.filter((f) => !cards.some((c) => inCard(c.n).includes(f)));
  return (
    <div className="mt-8 space-y-6">
      {cards.map((c) => (
        <div key={c.key} className="rounded-[20px] border border-[rgba(101,71,79,0.16)] bg-white/70 px-5 py-5 sm:px-6" data-testid={`decision-${c.n}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mauve-ink">{c.heading}</p>
          <div data-testid={`callback-${c.key}`}>
            {c.text ? (
              <blockquote className="mt-2 font-display text-xl italic leading-snug text-plum">{c.text}</blockquote>
            ) : !ctx.readOnly && c.missingText ? (
              <p className="mt-2 rounded-[12px] border border-dashed border-rose px-4 py-3 text-ink-muted">{c.missingText}</p>
            ) : null}
          </div>
          {c.extras.map((x) =>
            x.text || (!ctx.readOnly && x.missingText) ? (
              <div key={x.key} className="mt-3" data-testid={`callback-${x.key}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mauve-ink">{x.heading}</p>
                {x.text ? <p className="mt-1 font-display text-lg italic leading-snug text-plum">{x.text}</p> : <p className="mt-1 text-sm text-ink-muted">{x.missingText}</p>}
              </div>
            ) : null,
          )}
          <div className="mt-5 space-y-5 border-t border-rose/60 pt-5">
            {inCard(c.n).map((f) => (
              <FieldView key={f.key} field={expandField(ctx.schema, f)[0]!} {...ctx} compact />
            ))}
          </div>
        </div>
      ))}
      {rest.length ? <FieldList fields={rest} context="" {...ctx} /> : null}
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
  const items: ReactNode[] = [];
  const carded = new Set<string>();
  for (const f of fields) {
    const group = f.repeat ? ctx.schema.repeat_groups?.[f.repeat] : undefined;
    if (f.repeat && group?.label && !group.label_from) {
      // A labelled group renders row by row: one card per row holding every field of that row. A group that names
      // its columns from answers (label_from: ideas, problems) renders as columns instead.
      if (carded.has(f.repeat)) continue;
      carded.add(f.repeat);
      items.push(<RepeatCards key={`group-${f.repeat}`} group={f.repeat} fields={fields.filter((x) => x.repeat === f.repeat)} {...ctx} />);
    } else if (f.repeat) items.push(<RepeatGrid key={f.key} field={f} context={context} {...ctx} />);
    else items.push(<FieldView key={f.key} field={expandField(ctx.schema, f)[0]!} {...ctx} />);
  }
  return <div className="mt-8 space-y-8">{items}</div>;
}

/**
 * repeat_groups with a label ("Observation {k}"): one card per row. With min_visible, the first rows show and
 * add_label reveals the next hidden row, up to every key; rows that already have answers always show.
 */
function RepeatCards({ group, fields, ...ctx }: FieldCtx & { group: string; fields: WorksheetField[] }) {
  const g = ctx.schema.repeat_groups![group]!;
  const [shown, setShown] = useState(() => visibleRows(ctx.schema, group, ctx.answers));
  const focusKey = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const keys = g.keys.slice(0, shown);

  // After "Add another observation", move focus into the row it revealed.
  useEffect(() => {
    const k = focusKey.current;
    if (!k) return;
    focusKey.current = null;
    listRef.current?.querySelector<HTMLElement>(`[data-row="${k}"] input, [data-row="${k}"] textarea`)?.focus();
  }, [shown]);

  // Each field's guide once above the rows, not in every card (brief 14).
  const guides = fields.filter((f) => f.guide);
  return (
    <div className="space-y-6" ref={listRef} data-testid={`rows-${group}`}>
      {guides.length ? (
        <ul className="max-w-2xl space-y-1 text-[0.95rem] leading-relaxed text-ink-muted">
          {guides.map((f) => (
            <li key={f.key}>
              {fields.length > 1 && f.label ? <span className="font-semibold text-ink">{f.label.replaceAll(" {k}", "").replaceAll("{k}", "")}: </span> : null}
              {f.guide}
            </li>
          ))}
        </ul>
      ) : null}
      {keys.map((k) => {
        const row = fields.map((f) => expandField(ctx.schema, f).find((c) => c.repeatKey === k)).filter((c): c is ConcreteField => Boolean(c));
        const heading = g.label!.replaceAll("{k}", k);
        return (
          <fieldset key={k} data-row={k} data-testid={`row-${group}-${k}`} className="min-w-0 rounded-[20px] border border-[rgba(101,71,79,0.16)] bg-white/70 px-5 pb-6 pt-2 sm:px-6">
            <legend className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-mauve-ink">
              {heading}
              {row.some(isRequired) ? <span className="ml-1 normal-case tracking-normal text-ink-muted">(required)</span> : null}
            </legend>
            <div className="mt-2 space-y-5">
              {row.map((c) => (
                // "Problem 1" in a card headed "Problem 1": the legend says it, so the field keeps it only as its name.
                <FieldView key={c.key} field={c} {...ctx} hideRequired hideGuide compact hideLabel={c.label === heading} ariaLabel={c.label === heading ? heading : undefined} />
              ))}
            </div>
          </fieldset>
        );
      })}
      {!ctx.readOnly && g.add_label && shown < g.keys.length ? (
        <button
          type="button"
          onClick={() => {
            focusKey.current = g.keys[shown]!;
            setShown(shown + 1);
          }}
          className="inline-flex min-h-11 items-center rounded-full border border-dashed border-plum px-5 font-semibold text-plum hover:bg-rose-soft/50"
        >
          {g.add_label}
        </button>
      ) : null}
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

/**
 * Subsections that each ask one question of every column (Lesson 4: five questions x three problems) render as one
 * grid. The group they repeat over, or null when the subsections are ordinary.
 */
function matrixGroup(schema: WorksheetSchema, subs: WorksheetSubsection[] | undefined): string | null {
  if (!subs || subs.length < 2) return null;
  const group = subs[0]!.fields[0]?.repeat;
  const g = group ? schema.repeat_groups?.[group] : undefined;
  // Columns named from answers with a fallback label ("Problem {k}", Lesson 4). Lesson 2's ideas have no fallback
  // label and keep their reviewed layout: one grid per test.
  if (!group || !g?.label_from || !g.label) return null;
  return subs.every((sub) => sub.fields.length === 1 && sub.fields[0]!.repeat === group) ? group : null;
}

/**
 * One grid for every question x column. Desktop: a row per question under its heading, a column per problem.
 * Mobile stacks by problem (brief 12): all five questions for Problem 1, then Problem 2. One set of inputs either
 * way; CSS order moves them, so nothing is rendered twice.
 */
function RepeatMatrix({ subs, group, ...ctx }: FieldCtx & { subs: WorksheetSubsection[]; group: string }) {
  const g = ctx.schema.repeat_groups![group]!;
  const order = (n: number) => ({ "--o": n }) as CSSProperties;
  return (
    <div className="mt-10 flex flex-col gap-5 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-4" data-testid={`matrix-${group}`}>
      {g.keys.map((k) => (
        <p key={`col-${k}`} className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-mauve-ink md:block" data-testid={`col-head-${group}-${k}`}>
          {groupHeading(g, k, ctx.answers)}
        </p>
      ))}
      {g.keys.map((k, ki) => (
        <h4 key={`row-${k}`} style={order((ki + 1) * 100)} className="order-(--o) mt-4 border-t border-rose pt-5 font-display text-2xl font-medium md:hidden">
          {groupHeading(g, k, ctx.answers)}
        </h4>
      ))}
      {subs.map((sub, si) => (
        <Fragment key={sub.key}>
          <div className="mt-6 hidden max-w-2xl md:col-span-3 md:block">
            <h4 className="font-display text-2xl font-medium">{sub.title}</h4>
            {sub.ask ? <p className="mt-1 font-display text-lg italic text-mauve-ink">{sub.ask}</p> : null}
            {sub.guide ? <p className="mt-2 leading-relaxed text-ink-muted">{sub.guide}</p> : null}
          </div>
          {expandField(ctx.schema, sub.fields[0]!).map((c, ki) => {
            const heading = groupHeading(g, c.repeatKey!, ctx.answers);
            return (
              <div key={c.key} style={order((ki + 1) * 100 + si + 1)} className="order-(--o) min-w-0 md:order-none" data-testid={`cell-${c.key}`}>
                <div className="mb-2 md:hidden">
                  <p className="font-semibold">{sub.title}</p>
                  {sub.ask ? <p className="text-sm italic text-mauve-ink">{sub.ask}</p> : null}
                  {/* The question's guide once, under the first problem, so the phone page stays short. */}
                  {ki === 0 && sub.guide ? <p className="mt-1 text-sm leading-relaxed text-ink-muted">{sub.guide}</p> : null}
                </div>
                <FieldView field={c} {...ctx} ariaLabel={`${sub.title} for ${heading}`} hideLabel />
              </div>
            );
          })}
        </Fragment>
      ))}
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
        const heading = groupHeading(group, c.repeatKey!, ctx.answers);
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

function Label({ field, htmlFor, hide, hideRequired }: { field: ConcreteField; htmlFor: string; hide?: boolean; hideRequired?: boolean }) {
  if (hide || !field.label) return null;
  // required: false means "optional on purpose" (Lesson 5 test_terms, Lesson 7 headline_before): shown muted.
  const optional = field.required === false;
  return (
    <label htmlFor={htmlFor} className={cn("block font-semibold", optional ? "text-ink-muted" : "text-ink")}>
      {field.label}
      {optional ? <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">Optional</span> : null}
      {isRequired(field) && !hideRequired ? <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">Required</span> : null}
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

type ViewOpts = { ariaLabel?: string; hideLabel?: boolean; hideRequired?: boolean; hideGuide?: boolean; compact?: boolean };

function FieldView({ field, ariaLabel, hideLabel, hideRequired, hideGuide, compact, ...ctx }: FieldCtx & ViewOpts & { field: ConcreteField }) {
  const id = useId();
  const value = ctx.answers[field.key];
  const common = { id, disabled: ctx.readOnly, "aria-label": hideLabel ? ariaLabel : undefined, "data-field": field.key } as const;
  switch (field.type) {
    case "text":
    case "date":
      return (
        <div className="max-w-2xl">
          <Label field={field} htmlFor={id} hide={hideLabel} hideRequired={hideRequired} />
          {hideGuide ? null : <Help field={field} />}
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
          <Label field={field} htmlFor={id} hide={hideLabel} hideRequired={hideRequired} />
          {hideGuide ? null : <Help field={field} />}
          <textarea
            {...common}
            className={cn(inputCls, "mt-2 leading-relaxed", compact ? "min-h-24" : "min-h-32")}
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
      return <ChoiceField field={field} value={typeof value === "string" ? value : ""} hideRequired={hideRequired} {...ctx} />;
    case "multichoice":
      return <MultiChoiceField field={field} value={Array.isArray(value) ? value : []} hideRequired={hideRequired} {...ctx} />;
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
        data-field={`${field.key}.note`}
        disabled={ctx.readOnly}
        className={cn(inputCls, "mt-3 min-h-24 text-[0.95rem] leading-relaxed")}
        placeholder={field.note_placeholder ?? (field.note_required ? "Why? One sentence." : "Why? (optional)")}
        maxLength={field.max_length}
        value={current.note}
        onChange={(e) => ctx.update(field.key, { ...current, note: e.target.value })}
      />
    </div>
  );
}

/** "Problem" for option_label_from "problem_{k}" when its repeat group is labelled "Problem {k}"; else "Idea". */
function labelGroupWord(schema: WorksheetSchema, template: string) {
  const g = Object.values(schema.repeat_groups ?? {}).find((x) => x.label_from === template && x.label);
  return g?.label ? g.label.replace("{k}", "").trim() : "Idea";
}

function RequiredTag({ field, hide }: { field: ConcreteField; hide?: boolean }) {
  return isRequired(field) && !hide ? <span className="ml-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">Required</span> : null;
}

function ChoiceField({ field, value, hideRequired, ...ctx }: FieldCtx & { field: Extract<ConcreteField, { type: "choice" }>; value: string; hideRequired?: boolean }) {
  const guideId = useId();
  const options = choiceOptions(ctx.schema, field);
  // A list with guides (confidence_options, format_options): smaller chips, each guide on hover and the chosen one's
  // beneath.
  const listed = Boolean(field.options_from) || options.some((o) => o.guide);
  const chosen = options.find((o) => o.value === value);
  return (
    <div>
      <p className="font-semibold">
        {field.label}
        <RequiredTag field={field} hide={hideRequired} />
      </p>
      <div role="radiogroup" aria-label={field.label ?? field.key} className={cn("flex flex-wrap gap-2", listed ? "mt-2" : "mt-3")} data-field={field.key}>
        {options.map((o) => {
          // "Problem 1" or "Idea A" chips name an answer; they can be chosen once that answer is written.
          const source = field.option_label_from ? ctx.answers[field.option_label_from.replace("{k}", o.value)] : undefined;
          const named = !field.option_label_from || (typeof source === "string" && source.trim().length > 0);
          const label = field.option_label_from ? (named ? (source as string).trim() : labelFrom(field.option_label_from, o.value, ctx.answers, labelGroupWord(ctx.schema, field.option_label_from))) : o.label;
          const on = value === o.value;
          return (
            <label
              key={o.value}
              title={o.guide}
              className={cn(
                "inline-flex max-w-full cursor-pointer items-center rounded-full border-[1.5px] font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-plum",
                listed ? "min-h-9 px-3.5 text-[0.85rem]" : "min-h-10 px-4 text-sm",
                on ? "border-plum bg-plum text-white" : "border-[rgba(101,71,79,0.25)] bg-white text-ink",
                (!named || ctx.readOnly) && "cursor-not-allowed opacity-60",
              )}
            >
              <input type="radio" className="sr-only" name={field.key} value={o.value} checked={on} disabled={ctx.readOnly || !named} onChange={() => ctx.update(field.key, o.value)} />
              <span className="truncate">{label}</span>
              {o.guide ? <span className="sr-only">: {o.guide}</span> : null}
            </label>
          );
        })}
      </div>
      {listed && chosen?.guide ? (
        <p id={guideId} className="mt-2 text-sm text-ink-muted" data-testid={`guide-${field.key}`}>
          {chosen.guide}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Tick any number: an inline list (Lesson 8), or the rows of another repeat group that have content (Lesson 3
 * themes, each shown by number and the first words of the row).
 */
function MultiChoiceField({ field, value, hideRequired, ...ctx }: FieldCtx & { field: Extract<ConcreteField, { type: "multichoice" }>; value: string[]; hideRequired?: boolean }) {
  const group = field.options_from_repeat ? ctx.schema.repeat_groups?.[field.options_from_repeat] : undefined;
  const keys = multichoiceValues(ctx.schema, field);
  const offered = field.options_from_repeat ? repeatOptions(ctx.schema, field.options_from_repeat, ctx.answers) : [];
  // Inline options are all offered. Repeat rows: a ticked row emptied later stays listed, so it can be unticked.
  const options = field.options
    ? field.options.map((o) => ({ key: o.value, label: o.label, numbered: false }))
    : keys
        .filter((k) => offered.some((o) => o.key === k) || value.includes(k))
        .map((k) => ({ key: k, label: offered.find((o) => o.key === k)?.label ?? "", numbered: true }));
  const rowName = (k: string) => (group?.label ?? "{k}").replaceAll("{k}", k);
  function toggle(k: string, on: boolean) {
    const next = on ? [...value, k] : value.filter((x) => x !== k);
    ctx.update(field.key, keys.filter((x) => next.includes(x)));
  }
  return (
    <fieldset data-field={field.key} className="min-w-0">
      <legend className="font-semibold">
        {field.label}
        <RequiredTag field={field} hide={hideRequired} />
      </legend>
      {options.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">Your observations from step 1 show here once you write them.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {options.map((o) => {
            const on = value.includes(o.key);
            return (
              <label
                key={o.key}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-[12px] border-[1.5px] px-3 py-2 text-[0.95rem] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-plum",
                  on ? "border-plum bg-rose-soft/60" : "border-[rgba(101,71,79,0.18)] bg-white",
                  ctx.readOnly && "cursor-default",
                )}
              >
                <input type="checkbox" value={o.key} className="mt-1 size-4 shrink-0 accent-[#65474F]" checked={on} disabled={ctx.readOnly} onChange={(e) => toggle(o.key, e.target.checked)} />
                {o.numbered ? (
                  <span className="min-w-0">
                    <span className="sr-only">{rowName(o.key)}: </span>
                    <span aria-hidden className="mr-2 font-semibold text-plum">{o.key}</span>
                    <span className="text-ink">{o.label}</span>
                  </span>
                ) : (
                  <span className="min-w-0 text-ink">{o.label}</span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
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
              data-field={`${field.key}.${slot.key}`}
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
