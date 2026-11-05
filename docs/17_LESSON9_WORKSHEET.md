# 17: Lesson 9 worksheet: Business Foundation Blueprint

**For:** the BLB portal Claude Code session
**File:** `worksheet_m1-l9-foundation-blueprint.json`. It REPLACES the Lesson 9 placeholder seeded in Slice E (same slug). Seed as a draft on Module 1 Lesson 9.

## What's new in this schema

1. **Callbacks interleaved with fields.** The eleven `callbacks[]` quote Lessons 2 to 8. Each numbered callback (1 to 6) is rendered as a card: the quoted answer on top, then that decision's three fields from section 1 (`dec_n`, `ev_n`, `note_n`) directly beneath it. The unnumbered callbacks (`cb_problem_rule`, `cb_promise`, `cb_headline`, `cb_cta`, `cb_offer_dest`) sit inside the card of the decision before them as a second quoted line. `callback_layout` says this in one sentence. If a source worksheet isn't complete, show `missing_text` and still allow the verdict.
2. **`callbacks_inline` on section 4.** Four Lesson 1 answers quoted inside the section, above its fields. Same component, different position.
3. **Two option lists** (`verdict_options`, `evidence_options`) used by `choice` fields via `options_from`, same mechanism as Lesson 3's `confidence_options`. Render as chips.
4. **`optional: true` on section 2.** Not required for completion; collapsed by default with a "Show" toggle.
5. **`pdf` block.** The Lesson 9 PDF is the Blueprint: print the callbacks (quoted answers) as well as the fields, put `business_sentence` on the cover under the title, and keep offering "Download all Module 1 worksheets" here as Slice E already does.
6. **`admin_counts` tallies** over `dec_{n}` and `ev_{n}` (n = 1 to 6).

## Source keys this depends on

Lessons 4 to 8 use the keys named in the callbacks (`priority_problem`, `rule_continue`, `product_concept`, `outcome_promise`, `positioning`, `headline`, `first_topic`, `cta`, `offer_destination`). Lesson 1 keys: `q1_treating_as_business`, `q2_pay_for`, `q3_blog_disappeared`, `realization`. If the seeded Lesson 1 schema uses different keys, map them and tell me which.

Milestone: "I finished my Business Foundation Blueprint". Stop after seeding and testing on staging.
