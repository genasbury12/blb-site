# 14: Lesson 6 worksheet: Positioning Builder

**For:** the BLB portal Claude Code session
**File:** `worksheet_m1-l6-positioning.json` (same shape as the Lesson 1 to 5 schemas). Seed it as a draft on Module 1 Lesson 6, same as the earlier slices did for Lessons 1 to 5.

## Nothing new to build

Every feature here already exists from Lessons 1 to 3: text, textarea, date, rating, choice (inline `options`), sentence with four slots, one fixed repeat group of 3 (`alternatives`), two top-of-worksheet callbacks, `admin_counts` tallies, `footer_note`.

## Things to check

- **Two callbacks.** `callbacks[]` quotes Lesson 5 `product_concept` (text) and `outcome_promise` (sentence). The second template renders the sentence's three slots inline: `{result}`, `{timeframe}`, `{cost}`. If the portal's callback renderer only knows how to print a whole sentence field, print the composed sentence and ignore the slot names. Each callback has its own `missing_text`; show the one that applies and still let her work.
- **Sentence with four slots.** `positioning` uses `{person} {outcome} {method} {alternative}`. Lessons 2 and 3 used three slots; confirm the component doesn't cap at three.
- **Rating with note.** `diff_rating` is the Strong/Uncertain/Weak pill plus note, same as Lessons 1 and 2. The example stores it as `{ "value", "note" }`.
- **Optional textarea.** `concept_revised` is `required: false` and not in `required_fields`. Not in the admin table.
- **`admin_counts`** are two tallies over single choice fields (`diff_source`, `test_result`), not over repeat rows. Same tile as the Lesson 3 confidence tally.
- **Repeat group guide text.** `alt_name_{k}` has a guide that reads "1: what she does now. 2: the free option. 3: the paid option." Print it once above the three rows, not under each row.
- `callbacks_provided` lists `positioning`, `differentiator`, `not_for` for Lessons 7 and 9. Keep the keys stable.
- Milestone label: "I wrote a positioning sentence and named who it's not for". Create it as a draft on Module 1 like the others.

Stop after it's seeded and tested on staging. Report the same way as before.
