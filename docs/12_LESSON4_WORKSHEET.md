# 12: Lesson 4 worksheet, Problem Validation Scorecard

**For:** the BLB portal Claude Code session
**File:** `worksheet_m1-l4-problem-validation.json` (same shape as the Lesson 2 and 3 schemas). Seed it as a draft on Module 1 Lesson 4, same as before.

## What's new in this schema

1. **Text callbacks with `{value}`.** `callbacks[]` quotes Lesson 3 `theme_1`, `theme_2`, `theme_3` as three plain-text callbacks (template `Problem N: {value}`) plus the `snapshot` sentence (slot template, same as Lesson 3 did for the hypothesis). Render all four as one quote block under the first callback's heading; the later ones have empty `heading` and `missing_text` on purpose. If Lesson 3 is incomplete, show the first callback's `missing_text` once and still let her work.
2. **`prefill_from` on `problem_{k}`.** On first load, if the field is empty and Lesson 3's `theme_{k}` has a value, copy it in as the starting value (editable, saved as her own answer on first edit). Nice to have. If it's more than an hour, skip it and the callback quote above does the job.
3. **`rating` inside a 3-column repeat group.** Same `rating` type as Lesson 2 (Strong/Uncertain/Weak pills plus note, stored `{rating, note}`), but the repeat group is keyed `1, 2, 3` with `label_from: problem_{k}` and a fallback `label`. Five subsections, one rating per problem each: a 5 x 3 grid. `note_placeholder` is new: show it as the note textarea's placeholder. Mobile stacks by problem, not by question.
4. **`admin_counts` with `count_value`.** Two tiles: how many members rated Weak on any `help_{k}`, and on any `tried_{k}`. Count members, not cells.

## Also

- `priority_choice` uses `option_label_from: problem_{k}` like Lesson 2's `chosen`. Admin column shows the number.
- `review_date` guide says seven days; no validation on the date itself, just required.
- `callbacks_provided` lists what Lessons 5 and 9 quote. Keep the keys stable: `priority_problem`, `priority_evidence`, `validation_activity`, `rule_continue`, `rule_revise`, `review_date`.
- `footer_note` prints muted at the end of the PDF, same as before.
- Milestone label: "I chose a priority problem and wrote my decision rule". Create it as a draft on Module 1 like the others.

Stop after it's seeded and tested on staging. Report the same way as before.
