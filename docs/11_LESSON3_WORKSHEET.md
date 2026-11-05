# 11 — Lesson 3 worksheet: Customer Research Workbook

**For:** the BLB portal Claude Code session
**File:** `worksheet_m1-l3-customer-research.json` (same shape as the Lesson 1 and 2 schemas). Seed it as a draft on Module 1 Lesson 3, same as Slice E did for Lessons 1 and 2.

## Three schema features Lessons 1 and 2 didn't need

1. **Variable-length repeat group.** `repeat_groups.evidence` has 8 keys, `min_visible: 5`, and `add_label`. Show 5 rows on first load; "Add another observation" reveals the next hidden row, up to 8. Each row is the five `ev_*_{k}` fields laid out as one card: words, source, meaning, question, confidence. On the PDF, print only rows with content.
2. **`multichoice` with `options_from_repeat`.** `theme_rows_{k}` lets the student tick which evidence rows support a theme. Options are the evidence row numbers that have content, labelled with the first 60 characters of `ev_said_{k}`. Stored as an array of keys. In the admin table and CSV, show as "1, 2".
3. **Top-of-worksheet callback.** `callbacks[]` quotes the Lesson 2 hypothesis under "Where you started" before section 1, same component as the Lesson 9 placeholder uses. If Lesson 2 isn't complete, show `missing_text` instead and still let her work.

## Also

- `confidence_options` is a choice list, not a rating: no Strong/Uncertain/Weak pills. Render as three small radio chips with the guide text on hover or beneath.
- `admin_counts` adds two tiles to the admin worksheet page: how many observations each member logged (count of filled `ev_said_{k}`), and the tally of confidence values across all rows.
- `callbacks_provided` lists what Lessons 4, 7 and 9 will quote. Nothing to build now; just keep the keys stable.
- `footer_note` prints muted at the end of the PDF, same as Lesson 1.
- Milestone label: "I built a buyer snapshot from real evidence". Create it as a draft on Module 1 like the others.

Stop after it's seeded and tested on staging. Report the same way as before.
