# TASK: Build portal worksheets with saved responses

You are working in the existing BOSS Business System portal repository (Next.js, TypeScript strict, Supabase). Read `CLAUDE.md`, `DECISIONS_REGISTER.md`, `02_DATA_MODEL.md`, `03_ROLES_AND_ENTITLEMENTS.md`, and `05_DESIGN_SYSTEM.md` first. Then inspect the repo and report its current state before changing anything: existing migrations, the lesson page component, the auth/entitlement helpers, the admin layout, and any PDF or export code already present. Reuse what exists. Do not rebuild working pieces.

Owner decision 2026-11-02: student worksheets live inside the portal, not in Google Docs. Answers save per student, export as a branded PDF, and are visible to the owner in an admin table with CSV export. This task adds that. It does not change routes, entitlements, billing, or the audit engine.

Work in slices. After each slice: run lint and tests, write what changed to `BUILD_STATUS.md`, log anything unresolved in `IMPLEMENTATION_ISSUES.md`, and stop for review. Never seed production. Never claim a slice is done without a passing test.

---

## Slice A: data model

Create a migration adding:

```sql
create table worksheets (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version int not null default 1,
  module_slug text not null,
  lesson_slug text not null,
  title text not null,
  schema jsonb not null,
  status text not null default 'draft' check (status in ('draft','review','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, version)
);

create table worksheet_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  worksheet_slug text not null,
  worksheet_version int not null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress','complete')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, worksheet_slug)
);
create index on worksheet_responses (user_id);
create index on worksheet_responses (worksheet_slug, status);
```

RLS:
- `worksheets`: students select where status = 'published' and they hold an active entitlement to the module (reuse the existing entitlement check). Admin role: all operations.
- `worksheet_responses`: a user selects, inserts, updates only rows where `user_id = auth.uid()`. Coach and admin roles select all. Only admin deletes. No student can read another student's row, verified by a direct API test, not only through the UI.

`updated_at` trigger on both tables, matching whatever the repo already does for other tables.

Exit: migration applies cleanly locally; RLS tests pass for student, coach, admin, and anonymous.

---

## Slice B: schema-driven renderer

One React component, `WorksheetForm`, renders any worksheet from its `schema` jsonb. No per-worksheet components. The schema format is defined by the two JSON files at the end of this document (`m1-l1-starting-point`, `m1-l2-business-direction`). Support every construct they use:

- `intro`: eyebrow, title (render the last word in italic mauve), lead, optional quote, optional notes[].
- `sections[]` with `number`, `title`, `ask` (italic serif subhead), `guide`, `fields[]`, optional `subsections[]` (same shape, no number), optional `footer`.
- `repeat_groups`: a field with `repeat: "ideas"` renders once per key (A, B, C) in a three-column grid. `label_from: "idea_{k}"` means the column heading shows the value of that field when filled, else "Idea A".
- Field types:
  - `text`, `textarea`, `date`: plain inputs with label, guide, placeholder, max_length.
  - `rating`: three pill buttons from `rating_options` (Strong, Uncertain, Weak) plus a note textarea. Stored as `{rating, note}`. Visual: Strong = filled plum pill, Uncertain = filled rose pill, Weak = outlined mauve pill, italic.
  - `choice`: pill buttons; `option_label_from: "idea_{k}"` shows the idea text on each pill.
  - `sentence`: a template string with `{slot}` placeholders rendered as inline inputs inside display-size serif text. Stored as `{slot: value}`. Also store a `_rendered` string with the full sentence for admin and PDF use.
- `required` and `required_for: ["A"]` (required only for repeat key A).
- `example`: shown under the guide in small italic mauve, prefixed "Hypothetical example:".

Styling follows `05_DESIGN_SYSTEM.md`: ivory page, Cormorant Garamond headings, DM Sans body, plum text, large rose numerals for section numbers, soft shaded inputs (`#FBF6F3`, 1.5px border `rgba(101,71,79,.18)`, mauve on focus, 14px radius), no bordered grids. Generous spacing: sections separated by a 1px rule and 54px. Mobile: columns stack.

Behavior:
- Autosave: debounce 800 ms per field, PATCH `answers` with a shallow merge server-side, show "Saved h:mm" in a sticky status bar. One request in flight per response; queue the latest change if one is pending. On failure show "Not saved, retrying" and retry with backoff.
- Progress: percent of `completion.required_fields` that are non-empty. Show in the status bar. Expose a hook `useWorksheetProgress(slug)` the lesson page and dashboard can read.
- Complete button: sets status complete and completed_at, label becomes "Lesson N complete ✓", still editable afterward. Emits the milestone named in `completion.milestone_label` through the existing milestone mechanism.
- Callbacks: a section may declare `callback: {worksheet, field}`. Render that field's saved answer from the same user's other response as a read-only quote block above the section, labeled with the source lesson. Hide if empty. (Lesson 9 uses this. Lesson 3 should show the Lesson 2 `hypothesis._rendered`.)
- Draft or review worksheets are never served to students, same gate as draft lessons.

Lesson page: below the video and resources, render `WorksheetForm` for the lesson's published worksheet, under an "Your worksheet" heading. If the lesson has none, render nothing.

Exit: a test student fills Lesson 2 on one device, reloads on another, and sees every answer. A Playwright test covers autosave, progress, rating pills, the sentence field, and the complete button.

---

## Slice C: PDF export

Route `GET /api/worksheets/[slug]/pdf` for the signed-in user's own response. Render with the brand template: ivory margin, eyebrow, title, each section with its number and title, each answer in a soft shaded block, ratings shown as the word plus note, the hypothesis sentence set in serif at 18pt. Footer: "The BOSS Business System · Module 1" and the date. File name `BOSS_Module1_Lesson2_Worksheet.pdf`. Use whatever PDF approach the repo already has; if none, use `@react-pdf/renderer` or server-side Playwright, whichever is simpler to maintain here. Button on the worksheet: "Download my worksheet".

Also `GET /api/worksheets/module/[module_slug]/pdf`: all of the user's completed worksheets for the module in one PDF, used at Lesson 9.

Exit: PDF opens, fonts render, no overflow on a long answer.

---

## Slice D: admin

Route `/admin/worksheets` lists worksheets with counts (started, complete). Route `/admin/worksheets/[slug]`:
- Table of all responses: student name and email, status, completed_at, then the columns named in the schema's `admin_columns` (resolve `{chosen}` to the chosen repeat key). Rating cells render the pill.
- Counts at top: started, completed, and for each rating field in `admin_columns`, how many rated Weak.
- Filters: status, cohort (if the repo has cohorts; otherwise skip and log it).
- Click a row: read-only render of the full worksheet using `WorksheetForm` in display mode.
- "Export CSV": all responses flattened one column per field key, rating fields as two columns (`key_rating`, `key_note`), sentence fields as the rendered string. Server-generated, admin only.
- Coach role: same views, read only, no export unless `DECISIONS_REGISTER` says otherwise.

Member Library (owner addition 2026-11-03):
- Add a "Your worksheets" section to the member Library page (`/app/library`).
- List every published worksheet for each module the member can access, grouped by module.
- Each row shows its status (not started, in progress, complete), links to the worksheet on its lesson page, and offers the PDF download (`/api/worksheets/[slug]/pdf`) when complete.
- Include the "Download all Module 1 worksheets" button (`/api/worksheets/module/[module_slug]/pdf`) there too.
- Reuse the Library's existing list styling.

Exit: admin sees the test student's row; CSV opens in a spreadsheet with correct headers; the member's Library shows each published worksheet with the right status, lesson link, and PDF download when complete.

---

## Slice E: seed and wire Lessons 1 and 2

Seed script (local and staging only) inserts the two schemas below as `draft`. Admin publishes from the catalog UI. Wire Lesson 1 and Lesson 2 lesson pages. Lesson 9 placeholder: a section with callbacks to `m1-l1-starting-point.q3` and `m1-l2-business-direction.hypothesis` so the mechanism is proven now, even though Lesson 9's full worksheet comes later.

Update the student dashboard next-action card: if a published worksheet for the current lesson is in_progress, the card says "Finish your Lesson N worksheet".

---

## Privacy and logging

Worksheet answers are student personal data. Never log answer content. Log field keys, timestamps, and response ids only. Include `worksheet_responses` in the existing data export and deletion flows. Retention follows DECISIONS_REGISTER item 7; until the owner sets it, do not auto-delete.

## Acceptance (all must pass before the owner reviews)

1. Anonymous and other-student API calls cannot read or write a response that is not theirs.
2. Draft worksheets are invisible to students.
3. Autosave survives a reload and a second device.
4. Progress and milestone update correctly.
5. PDF downloads with correct fonts and brand colors.
6. Admin table and CSV match the stored data.
7. Lesson 9 placeholder shows the student's own Lesson 1 and 2 answers.
8. Lint, typecheck, and tests green.

---

## Schema: m1-l1-starting-point

```json
{
  "slug": "m1-l1-starting-point",
  "module_slug": "module-1",
  "lesson_slug": "lesson-1",
  "title": "Lesson 1: Starting Point",
  "version": 1,
  "status": "draft",
  "intro": {
    "eyebrow": "Module 1 · Lesson 1 · Your worksheet",
    "title": "Starting Point",
    "lead": "Answer these once, right after Lesson 1. Don't try to make them sound impressive. Honest answers are the useful ones. You'll come back to these at the end of Module 1 and compare them with your finished Business Foundation Blueprint."
  },
  "sections": [
    {
      "key": "questions",
      "fields": [
        { "key": "q1", "type": "textarea", "label": "1. What have you been treating as your blogging business?", "guide": "Name where most of your time and energy has gone so far. Your blog posts, Instagram, Pinterest views, your website design, or something else.", "example": "My blog posts and Pinterest. I've been measuring progress by pageviews and how my homepage looks.", "required": true, "max_length": 1500 },
        { "key": "q2", "type": "textarea", "label": "2. What do you ultimately want someone to pay you for?", "guide": "You don't need the exact product yet. Describe the result, transformation, or solution you want to provide, and who it's for if you already know.", "example": "Helping overwhelmed moms keep their homes organized with young kids. Probably a simple system. Not sure of the format yet.", "required": true, "max_length": 1500 },
        { "key": "q3", "type": "textarea", "label": "3. If your blog disappeared tomorrow, would you still have a business idea?", "guide": "Start with yes, no, or partly. Then write what you would still know: who you want to help, the problem you want to solve, and what you could sell. If the answer is no, that's okay. That's exactly what Module 1 is for.", "example": "Partly. I know who I want to help. I don't know the exact problem they'd pay to fix or what I'd sell.", "required": true, "max_length": 1500 },
        { "key": "realization", "type": "textarea", "label": "4. Your Biggest Realization", "guide": "After Lesson 1, what do you understand differently about building a blogging business? One or two sentences is enough.", "example": "I've been creating content and hoping it turns into a business. I need to start with the person and the problem.", "required": true, "max_length": 800 }
      ]
    }
  ],
  "completion": { "milestone_label": "I answered Lesson 1: Starting Point", "required_fields": ["q1", "q2", "q3", "realization"] },
  "admin_columns": ["q3", "realization"]
}
```

## Schema: m1-l2-business-direction

```json
{
  "slug": "m1-l2-business-direction",
  "module_slug": "module-1",
  "lesson_slug": "lesson-2",
  "title": "Lesson 2: Business Direction Workshop",
  "version": 1,
  "status": "draft",
  "intro": {
    "eyebrow": "Module 1 · Lesson 2 · Your worksheet",
    "title": "Business Direction Workshop",
    "lead": "Compare up to three ideas against the same four tests, then pick one to test first. Not forever. First.",
    "quote": "A business direction is a hypothesis. Not a guarantee.",
    "notes": [
      "What this worksheet does not do: it does not tell you whether people will pay. A column full of Strong means this is the most credible direction to research next. Whether she buys is what Lessons 3 and 4 find out.",
      "Already have a blog? Your current direction is Idea A. Rate it against the same four tests, honestly."
    ]
  },
  "repeat_groups": { "ideas": { "keys": ["A", "B", "C"], "label_from": "idea_{k}" } },
  "rating_options": [
    { "value": "strong", "label": "Strong", "guide": "I have real experience or real evidence." },
    { "value": "uncertain", "label": "Uncertain", "guide": "I think so, but I haven't checked. This is a normal, honest answer." },
    { "value": "weak", "label": "Weak", "guide": "I have a reason to doubt it." }
  ],
  "sections": [
    {
      "key": "ideas", "number": "1", "title": "Name your ideas", "ask": "Who would you help, and with what?",
      "guide": "One line each. Not a tagline, not a brand name. Just the person and the thing. If you only have one idea, write it as A and leave the others empty.",
      "fields": [
        { "key": "idea_A", "type": "text", "label": "Idea A", "required": true, "max_length": 160, "placeholder": "e.g. Meal planning for parents of picky eaters" },
        { "key": "idea_B", "type": "text", "label": "Idea B", "required": false, "max_length": 160 },
        { "key": "idea_C", "type": "text", "label": "Idea C", "required": false, "max_length": 160 }
      ]
    },
    {
      "key": "tests", "number": "2", "title": "Run the four tests", "ask": "For each idea, each test: one word and one sentence.",
      "guide": "The word is Strong, Uncertain, or Weak. The sentence is why. The sentence is the real answer, so don't skip it. Read the whole page, not a score: one Weak on credibility sinks an idea no matter how many Strongs it collects.",
      "subsections": [
        { "key": "cred", "title": "Credibility", "ask": "Do I know enough to help this person responsibly?", "guide": "From experience, training, work, or results. You don't need to be the leading expert. You need to be trustworthy. If you're not there yet, say what you'd have to learn or who you'd need alongside you.", "fields": [ { "key": "cred_{k}", "type": "rating", "repeat": "ideas", "note_required": true, "required_for": ["A"], "max_length": 600 } ] },
        { "key": "need", "title": "Buyer need", "ask": "Is she actively trying to fix this, and can I reach her?", "guide": "Who exactly is she? What is she trying to change, solve, achieve, or avoid? What evidence do you have that she wants it fixed: questions people ask you, things they already pay for, complaints you keep hearing? And where does she already look for help? Enjoying a topic is not evidence.", "fields": [ { "key": "need_{k}", "type": "rating", "repeat": "ideas", "note_required": true, "required_for": ["A"], "max_length": 600 } ] },
        { "key": "fit", "title": "Delivery fit", "ask": "Can I build and deliver a first version with my real life?", "guide": "Your actual hours, skills, tools, and responsibilities. A daily membership sounds exciting until you remember you have two hours on Tuesdays. How fast could you put a small version in front of real people? Every month spent building is a month not learning.", "fields": [ { "key": "fit_{k}", "type": "rating", "repeat": "ideas", "note_required": true, "required_for": ["A"], "max_length": 600 } ] },
        { "key": "logic", "title": "Commercial logic", "ask": "Can I say what she gets and why she'd pay, in one sentence?", "guide": "Not revenue math. Just whether the model makes sense. What does she receive? Why is that worth money to her? If you can't say it simply, that's information.", "fields": [ { "key": "logic_{k}", "type": "rating", "repeat": "ideas", "note_required": true, "required_for": ["A"], "max_length": 600 } ] },
        { "key": "assume", "title": "What I'm assuming", "ask": "The things I'm treating as true without proof.", "fields": [ { "key": "assume_{k}", "type": "textarea", "repeat": "ideas", "required_for": ["A"], "max_length": 600 } ] }
      ]
    },
    {
      "key": "decision", "number": "3", "title": "Choose one to test", "ask": "The most credible, testable direction. Not the most exciting one.",
      "guide": "Look across your four tests. Which idea has the fewest serious problems and the fastest path to real feedback? That's the one. It isn't a winner yet. It's the strongest hypothesis you have.",
      "fields": [
        { "key": "chosen", "type": "choice", "label": "I'm testing", "options": ["A", "B", "C"], "option_label_from": "idea_{k}", "required": true },
        { "key": "hypothesis", "type": "sentence", "label": "My hypothesis", "template": "I am exploring a business that helps {person} solve {problem} through {solution}.", "slots": [ { "key": "person", "placeholder": "person", "max_length": 120 }, { "key": "problem", "placeholder": "problem", "max_length": 120 }, { "key": "solution", "placeholder": "type of solution", "max_length": 120 } ], "required": true },
        { "key": "why", "type": "textarea", "label": "Why this one", "guide": "Two or three sentences. Point at evidence, not excitement.", "required": true, "max_length": 1200 },
        { "key": "assumption", "type": "textarea", "label": "My biggest unchecked assumption", "required": true, "max_length": 600 },
        { "key": "next_step", "type": "textarea", "label": "One thing I'll do this week to check it", "guide": "Talk to five people. Read what they complain about. Search where they already ask for help.", "required": true, "max_length": 600 },
        { "key": "review_date", "type": "date", "label": "I'll review the evidence on", "required": true }
      ],
      "footer": "Choosing a direction to research is cheap and reversible. Paying for branding before you've tested it is not. Stay in the cheap column until the evidence says otherwise."
    }
  ],
  "completion": { "milestone_label": "I chose a provisional direction and wrote my hypothesis", "required_fields": ["idea_A", "cred_A", "need_A", "fit_A", "logic_A", "assume_A", "chosen", "hypothesis", "why", "assumption", "next_step", "review_date"] },
  "admin_columns": ["chosen", "cred_{chosen}", "need_{chosen}", "fit_{chosen}", "logic_{chosen}", "assumption"],
  "callbacks_provided": { "hypothesis": "Used by m1-l3-customer-research and m1-l9-foundation-blueprint" }
}
```

## Reference

A clickable prototype of the intended student and admin experience exists as the owner's Claude artifact "BOSS Portal Prototype: Worksheets That Save". Match its structure and tone, not its code.
