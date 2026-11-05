# 16: Lesson 8 worksheet: Blog to Buyer Journey Map

**For:** the BLB portal Claude Code session
**File:** `worksheet_m1-l8-blog-to-buyer.json` (same shape as the Lesson 1 to 7 schemas). Seed it as a draft on Module 1 Lesson 8, same as the others.

## Two small schema additions

1. **Named choice lists beyond `confidence_options`.** Three top-level lists: `stage_options`, `exists_options`, `tested_options`. Fields reference them with the existing `options_from` key. Render exactly like `confidence_options` in Lesson 3: small radio chips, guide text beneath where a guide is present. Nothing else changes; just resolve `options_from` against any top-level key, not only `confidence_options`.
2. **`multichoice` with inline `options`.** `pieces_exist` lists its options directly (value + label) instead of `options_from_repeat`. Stored as an array of values. Not required; an empty array is a valid, complete answer. In the admin table and CSV, show as the labels joined with ", ".

## Already built, used here

- Two top-of-worksheet `callbacks[]` (Lesson 5 `product_concept`, Lesson 7 `headline`), each with its own `missing_text`. Show both stacked under their headings before section 1. Lesson 7 missing should not block the worksheet.
- Fixed repeat group `posts` with keys 2 and 3 (the first post lives in section 2 as plain fields). Each row is topic, question, stage chip, CTA laid out as one card. A `choice` field inside a repeat group (`post_stage_{k}`) uses `options_from` like the Lesson 3 `ev_conf_{k}`.
- `sentence` field `blog_job` with two slots.
- `admin_counts` adds two tally tiles: reader stage across students, and link tested across students.
- `callbacks_provided` lists the seven keys Lesson 9 quotes. Keep them stable.
- `footer_note` prints muted at the end of the PDF.
- Milestone label: "I mapped one post to my offer and tested the path". Create it as a draft on Module 1 like the others.

Stop after it's seeded and tested on staging. Report the same way as before.
