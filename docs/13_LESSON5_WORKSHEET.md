# 13: Lesson 5 worksheet: Product Direction Evaluator

**For:** the BLB portal Claude Code session
**File:** `worksheet_m1-l5-product-direction.json` (same shape as the Lesson 1 to 4 schemas). Seed it as a draft on Module 1 Lesson 5, same as the others.

## Nothing new to build

Every feature in this schema already exists from Lessons 1 to 4: text, textarea, date, rating (Strong/Uncertain/Weak with note), choice, sentence with slots, a variable-length repeat group with `min_visible`, top-of-worksheet callbacks, `admin_counts`, `footer_note`.

Two things to check rather than build:

1. **Two callbacks from two different worksheets.** `callbacks[]` quotes L4 `priority_problem` and L3 `snap_constraints`, each with its own `missing_text`. Render both under their headings before section 1; if one source is incomplete show only that one's `missing_text` and still let her work.
2. **Named option lists for `choice`.** `format` uses `options_from: "format_options"` and `product_decision` uses `options_from: "decision_options"`, the same pattern L3 used for `confidence_options`. Render as radio chips with the guide text beneath. If the L1/L2 choice fields used inline `options` instead, map these the same way; the shape is value/label/guide either way.

## Also

- `repeat_groups.steps` has 5 keys, `min_visible: 3`, "Add another step". Rows are a single `step_{k}` text field. Only rows 1 to 3 are required. PDF prints rows with content.
- `test_terms` is the one optional field; render it muted and don't count it toward completion.
- `admin_counts` adds two tally tiles: decision (test/revise/pause) and format chosen.
- `callbacks_provided` lists what Lessons 6, 8 and 9 quote. Keys must stay stable: `product_concept`, `format`, `smallest_version`, `outcome_promise`, `product_decision`.
- Milestone label: "I chose a product concept and wrote a promise I can keep".

Stop after it's seeded and tested on staging. Report the same way as before.
