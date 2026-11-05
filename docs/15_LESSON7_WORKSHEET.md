# 15: Lesson 7 worksheet: Brand Messaging Builder

**For:** the BLB portal Claude Code session
**File:** `worksheet_m1-l7-messaging.json` (same shape as the Lesson 1 to 6 schemas). Seed it as a draft on Module 1 Lesson 7, same as the others.

## Schema features this one uses

Everything here already exists from Lessons 1 to 6: text, textarea, choice, fixed repeat groups (`phrases` x3, `benefits` x3, `objections` x2), top-of-worksheet callbacks, `admin_counts` tally, `footer_note`. Two things to check, both likely built by Lesson 5 or 6 already:

1. **Textarea callbacks with a single `{value}` slot.** Three of the four `callbacks[]` quote a plain textarea (`l6_differentiator`, `l3_snap_language`, `l3_snap_objections`) rather than a sentence field. The template is `"From Lesson 3: {value}"` where `{value}` is the whole stored text. If Lesson 5's `snap_constraints` callback already renders this way, nothing to build. The fourth (`l6_positioning`) is a sentence callback, same as Lesson 3's hypothesis.
2. **Four callbacks at the top.** Render them in order under their own headings before section 1. If any source is missing, show its `missing_text` and still let her work.

## Also

- `headline_before` and `proof_gap` are optional (`required: false`); the rest are required. Optional fields still print on the PDF if filled.
- `read_aloud` is a two-option `choice` with inline `options` (not `options_from`). Render as two radio chips.
- `admin_counts` has one tile: tally of `read_aloud` values.
- `callbacks_provided` lists the keys Lessons 8 and 9 quote: `headline`, `supporting_statement`, `benefit_1..3`, `objection_1..2`, `proof_available`, `claims_to_remove`. The objection answers live in `objection_answer_1..2`; Lesson 9 may quote those too, so keep them stable.
- Milestone label: "I wrote a headline in her words and cut the claims I can't back up". Create it as a draft on Module 1 like the others.

Stop after it's seeded and tested on staging. Report the same way as before.
