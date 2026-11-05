# 18: Module 1 worksheets, Lessons 3 to 9, all at once

**For:** the BLB portal Claude Code session.
**What this is:** seven worksheet schemas and their dev notes (11 to 17). Same shape as the Lessons 1 and 2 schemas already seeded. Read each dev note; it lists the schema features that lesson needs beyond what Lessons 1 to 3 already use.

## Order
Seed in lesson order, 3 to 9, as drafts on Module 1 Lessons 3 to 9 (sample lessons on staging until the real ones exist). Lesson 9 REPLACES the Slice E placeholder (same slug). Each lesson gets its milestone as a draft too.

## The key contract (callbacks between worksheets)
Every `callbacks[]` entry quotes a field from an earlier worksheet by `source_worksheet` and `source_field`. The keys are fixed:
- m1-l1-starting-point: q1_treating_as_business, q2_pay_for, q3_blog_disappeared, realization (if the seeded Lesson 1 schema uses different keys, map them and tell Genasys which)
- m1-l2-business-direction: hypothesis, chosen
- m1-l3-customer-research: theme_1..3, snapshot, snap_language, snap_objections, snap_constraints
- m1-l4-problem-validation: priority_problem, priority_evidence, validation_activity, rule_continue, rule_revise, review_date
- m1-l5-product-direction: product_concept, format, smallest_version, outcome_promise, product_decision
- m1-l6-positioning: positioning, differentiator, not_for
- m1-l7-messaging: headline, supporting_statement, benefit_1..3, objection_1..2, proof_available, claims_to_remove
- m1-l8-blog-to-buyer: first_topic, reader_question, reader_stage, cta, email_destination, offer_destination, next_improvement
Repeat-group keys like `theme_{k}` expand to theme_1, theme_2, theme_3. A sentence field's value is an object of its slots; a callback with a `template` renders the slots into it.

## Schema features across the set (build once, reuse)
- Variable-length repeat groups with `min_visible` and `add_label` (L3 evidence log)
- `multichoice` with `options_from_repeat` (L3) and with inline options (L8)
- Named choice lists resolved via `options_from` (L3 confidence_options, L8 stage/exists/tested options, L9 verdict/evidence options)
- Top-of-worksheet `callbacks[]` with `template` and `missing_text`; textarea callbacks with a single `{value}` slot (L4, L5, L7)
- `callbacks_inline` inside a section (L9) and `callback_layout` interleaving callbacks with fields (L9)
- `optional: true` section (L9), `admin_counts` tallies, `footer_note`, `pdf` block (L9 cover sentence)

## Test
One browser journey: a member completes Lessons 2 through 9 in order with the hypothetical example data from each schema's `example_response`, and every callback shows the right quoted answer. Then the Lesson 9 PDF and the "Download all Module 1 worksheets" bundle.

Stop after seeding and testing. Report per lesson: seeded, tested, deviations, decisions.
