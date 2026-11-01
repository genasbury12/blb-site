# BOSS Claude Developer Handoff: specifications

_Copied from Google Drive folder "BOSS Claude Developer Handoff" on 2026-11-01. Files merged into one document; text is verbatim except markdown escaping. Files used: FINAL_00_START_HERE.md, 01_PRODUCT_AND_ROUTES.md, 02_DATA_MODEL.md, FINAL_03_ROLES_AND_ENTITLEMENTS.md, FINAL_04_AUDIT_ENGINE.md, FINAL_05_DESIGN_SYSTEM.md, 06_BUILD_SEQUENCE_AND_QA.md, FINAL_07_IMPLEMENTATION_CONTRACT.md. Where both a FINAL_ and a non-final version exist, the FINAL_ version is used. Decisions: see FINAL_DECISIONS_REGISTER.md._

---

## 00 START HERE (FINAL)

Status: PRODUCT AND TECHNICAL DEFAULTS FINALIZED BY OWNER DELEGATION ON 2026-11-01. Development may begin. Live production billing, legal copy, credentials and deployment require separate release approval.

### Sources and precedence
1. Approved offer decisions and current owner instructions.
2. Phase 2 Program Architecture, Audit and Student Experience documents in Drive.
3. `DECISIONS_REGISTER.md` for delegated engineering and operational defaults.
4. Existing `CLAUDE.md` and Master Blueprint Reference bundled in `reference/`.
5. The specifications in this folder; `07_IMPLEMENTATION_CONTRACT.md` controls build execution.

Use the finalized decisions as defaults. Log unresolved conflicts in `IMPLEMENTATION_ISSUES.md`; ask only for material contradictions, legal release approval or real credentials. The prior master blueprint and guide may include older assumptions. Verify against current offer decisions before implementation.

### Start sequence
1. Inspect repository and read all source files.
2. Produce a discrepancy report and dependency map.
3. Apply finalized defaults in `DECISIONS_REGISTER.md`; do not restart product questionnaires.
4. Create a secure app skeleton and test fixtures, no live integrations.
5. Implement a vertical slice: authentication, entitlement checks, audit save, results, dashboard, lesson progress.
6. Continue in the order in `06_BUILD_SEQUENCE_AND_QA.md`.

### Nonnegotiables
Never store card data, expose Supabase service keys, trust tier claims from the client, publish unapproved copy, or mark sample content as final. Use Stripe test mode. Protect all student data with RLS and server authorization. Require approval before live billing, emails, data migration or deployment.

---

## 01 Product behavior and routes

### Public
`/`, `/program`, `/pricing`, `/masterclass`, `/masterclass/watch`, `/apply/elite`, `/apply/elite/confirmation`, `/login`, `/signup`, `/forgot-password`, `/privacy`, `/terms`, `/refund-policy`, `/contact`.

### Authenticated member
`/app` dashboard, `/app/audit`, `/app/audit/results/:runId`, `/app/training`, `/app/training/:moduleSlug/:lessonSlug`, `/app/library`, `/app/roadmap`, `/app/coaching`, `/app/community`, `/app/feedback`, `/app/account`, `/app/elite` for Elite only.

### Admin
`/admin` overview; students; catalog; audit versions; entitlements; coaching; feedback; workshops; Elite boards and hours; billing exceptions; audit log.

### Primary first session
After purchase, user creates account or signs in, claims the paid entitlement using server verified checkout association, and lands on dashboard. Primary CTA: Start My Business Audit. Do not lock paid training behind audit completion. Audit autosaves every answer, allows Back and Resume, and creates immutable scored run at submission. Dashboard shows a single next action, top three priorities, learning completion and milestone completion separately.

### Training experience
Eight modules unlocked to all active curriculum members: Business Foundation, Brand & Website, Content Production Engine, Marketing & Distribution, Digital Product Development, Email & Sales Systems, AI & Automation Hub, CEO Productivity System. Each module has 6 to 10 essential lessons, optional tutorials, downloads, and business milestones. Learning completion never automatically means a milestone is done. Only approved content is public to students; drafts remain private. Lesson page includes title, video, captions/transcript, objective, assignment, downloads, mark complete, next lesson.

### Roadmap
Six themes: Clarity & Foundation; Brand & Business Home; Product & Sales Infrastructure; Content & Visibility; Systems & Automation; Launch, Optimize & Grow. This is a recommended sequence, not a deadline or access lock. Preserve completed tasks on audit retake or path override.

### States every screen must support
Loading, empty, unauthorized, expired entitlement, failed payment grace, missing media, saved draft, network retry, and mobile layout. Use actual backend status, not optimistic fabricated success. Any actionable UI control must have a working handler and feedback.

---

## 02 Proposed Supabase Postgres data model

This is a design proposal, not a migration already executed. Every user owned table must use RLS and indexed owner foreign keys. Use UUID primary keys, created_at and updated_at where appropriate.

### Identity and access
- `profiles`: user_id references auth.users, display_name, timezone, onboarding_state.
- `products`: sku, title, active, curriculum_duration_months, coaching_duration_months.
- `orders`: user_id, stripe_customer_id, checkout_session_id unique, product_sku, payment_mode, payment_status, amount_cents, currency, created_at.
- `subscriptions`: user_id, stripe_subscription_id unique, sku, status, period_start/end, cancellation metadata.
- `entitlements`: user_id, feature_key, source_order_id, starts_at, ends_at, state, manual_override_reason, created_by. Unique appropriate active grant constraint; grants only from trusted server/admin.
- `billing_events`: stripe_event_id unique, type, processed_at, payload hash, outcome. Idempotent webhook processing.

### Learning catalog
- `modules`: slug unique, order_index, status (draft/review/approved/published), title, summary.
- `lessons`: module_id, slug, order_index, essential, status, video_provider_id, duration_seconds, transcript, objective, assignment.
- `lesson_resources`: lesson_id, storage_key, label, mime_type, published.
- `lesson_progress`: user_id, lesson_id, completed_at, unique(user_id,lesson_id).
- `milestones`: module_id, slug, title, evidence_policy, order_index.
- `milestone_progress`: user_id, milestone_id, state, completed_at, evidence_storage_key, reviewer_id.
- `roadmap_items`: user_id, source_audit_run_id, month_theme, priority_order, title, recommended_lesson_id, state, completed_at.

### Audit and personalization
- `audit_versions`: version_number, status, scoring_config_json, published_at.
- `audit_questions`: version_id, question_code, category_code, prompt, options_json, eligibility_rule.
- `audit_drafts`: user_id, version_id, answers_json, last_saved_at, unique(user_id,version_id) for active draft design.
- `audit_runs`: user_id, version_id, answers_snapshot_json, category_scores_json, overall_score, assigned_path, owner_override, submitted_at, recommendation_snapshot_json.

### Coaching and community
- `coaching_sessions`: type, starts_at, ends_at, meeting_url_private, capacity, published, recording_url_private.
- `session_registrations`: session_id, user_id, state.
- `feedback_submissions`: user_id, coaching_cycle_id, type, content, attachment_storage_key, state, response_due_at, reviewed_by, response_text.
- `community_posts` and `community_comments`: user_id, content, moderation_status, timestamps.
- `elite_boards`, `elite_board_items`, `elite_time_entries`: owner user_id, access restricted to owner/admin/assigned coach, minutes, notes, approval status.
- `admin_audit_log`: actor_id, action, entity_type, entity_id, changed_fields, timestamp.

### Design safeguards
Use separate private storage buckets for student evidence and Elite work. Signed, short lived URLs after server permission check. Keep Stripe raw webhook payload out of general student queries. Encrypt or limit retention of sensitive audit answers and private feedback. Define deletion, retention and backup policies before launch. No service role key in browser.

---

## 03 Roles and entitlements (FINAL)

### Roles
`student`, `coach`, `admin` are authorization roles. `Blueprint`, `Accelerator`, `Elite` are purchased products, not trusted client supplied roles. A user may have multiple entitlement grants; feature access is determined server side from active grants.

### Product policy from approved planning
Blueprint: $497 once or six payments of $97; curriculum, audit, templates and dashboard; no coaching.
Accelerator: $1497 once or six payments of $297; Blueprint plus six months of group coaching, community, two prerecorded workshops per month, monthly Hot Seat and two feedback submissions per monthly coaching cycle.
Elite: $4997 once or six payments of $897; Accelerator plus weekly private coaching, coach audit and roadmap, private board, 12 done for you hours; application required, capacity limited to five.
Graduate coaching: $97 per month after initial coaching period. Elite board retention is a separate $97 monthly offer. Curriculum access is 12 months, extended only under approved graduate coaching rules.

### Feature keys
`curriculum.read`, `audit.use`, `library.read`, `roadmap.use`, `group_coaching.access`, `community.access`, `feedback.submit`, `workshops.access`, `hotseat.apply`, `elite_coaching.access`, `elite_board.access`, `elite_dfu_hours.use`, `admin.manage`.

### Server decisions
On every protected read and mutation: authenticate, resolve grants from database, check time window and payment state, enforce per record ownership and rate limits. RLS is defense in depth, not the only authorization layer. Never expose private Elite boards across users. Admin access uses separately verified role claims. Coach permissions are scoped to assigned students and sessions.

### Payment lifecycle
Stripe Checkout in test mode first. Verify signed webhooks; deduplicate by event ID; handle out of order delivery and retry safely; reconcile orders, subscriptions and entitlements. Support paid, installment current, installment past due, canceled, refunded, disputed, expired and admin override states. Seven calendar day grace is approved as the engineering default; legal billing language still requires review before production. Installments are not automatically cancel anytime subscriptions; legal and contract language needs approval.

### Quotas and timing
Feedback: two per monthly coaching cycle, no rollover; response target three business days. Group Wednesday 1 PM Eastern, Hot Seat second Tuesday 1 PM Eastern, prerecorded workshops first and third Mondays. Elite private sessions weekly; private audit/roadmap target seven business days; 12 done for you hours tracked as consumed time. Implement these schedules as configured defaults; admin can adjust individual sessions and holiday exceptions.

---

## 04 Business audit engine specification (FINAL)

### Inputs
30 questions across eight categories: Foundation Q1 to Q4, Brand Q5 to Q7, Content Q8 to Q11, Marketing Q12 to Q14, Product Q15 to Q18, Email and Sales Q19 to Q22, AI Q23 to Q26, Productivity Q27 to Q30. Canonical question text and options live in the Phase 2 BOSS Business Audit document. Do not recreate wording from memory; import and version that document.

### Scoring
A=0, B=1, C=2, D=3. Category percentage = sum earned / (3 * applicable question count) * 100. Overall percentage = arithmetic mean of eight category percentages, not a raw sum weighted by question count. Do not silently omit questions. No N/A in version 1 because eligibility rules have not been approved; require all 30 answers. Display rounded percentages, retain raw precision for calculations.

### Paths
Recommend Build From Scratch if any of Q1, Q4, Q5 or Q15 is A or B. Recommend Optimize & Automate if all four are C or D. User may override path without changing original answers or scores; log override and timestamp.

### Priority selection
First identify essential gaps in customer/offer clarity, product, sales infrastructure, website, email, content/marketing, automation, productivity dependency order. Select three distinct, specific, implementable priorities, using lowest category scores when essential gaps are resolved. Each priority needs a plain language reason and a recommended module/lesson. Never infer guaranteed earnings or create unsupported claims.

### Module mapping
Foundation -> 1, Brand -> 2, Content -> 3, Marketing -> 4, Product -> 5, Email and Sales -> 6, AI -> 7, Productivity -> 8. Module 1 detailed starting lessons: Q1 low -> 1/2; Q2 low -> 3; Q3 low -> 6/7; Q4 low -> 4/5; Q16 low -> 4; Q17 low -> 5/6. For Modules 2 to 8 use category-to-module recommendation and first published essential lesson as an explicitly category-level fallback; do not fabricate question-specific mappings.

### Algorithm contract
`scoreAudit(auditVersion, answers)` returns immutable `categoryScores`, `overallScore`, `pathRecommendation`, `priorityRecommendations`, `startingLesson`, `roadmapRecommendation`, `explanations`, `scoringVersion`. Must be deterministic and unit tested. On retake create new audit run and preserve prior runs, completed lessons, milestones and roadmap history. No hidden AI scoring of objective answers. AI may optionally draft explanatory prose after deterministic logic, but never determine eligibility or entitlement.

### Required tests
All A -> zero; all D -> 100; mixed categories with different question counts; missing answer cannot submit; N/A eligibility; path threshold boundary; equal scores tie breaker; conflicting low essentials; retake history; manual override; audit version upgrade; recommendation references published lessons only; no change to existing progress.

---

## 05 Brand and interface system (FINAL)

Direction: Romantic Sophistication, feminine editorial, calm, polished and usable. Not a generic tech dashboard. Palette: dusty rose #E8C8CB, muted mauve #A56C78, ivory #F7EEE9, plum #65474F. Serif display headings, legible sans serif body. Avoid navy, gold and crown motifs. Use a text wordmark and open source Cormorant Garamond display plus DM Sans body; keep replaceable tokens.

### Component inventory
App shell, responsive side navigation, breadcrumb, next action card, audit stepper, question radio cards, autosave status, score bars, priority cards, roadmap timeline, module cards, lesson player, downloadable resource list, milestone checklist, submission uploader, feedback thread, coaching calendar, Elite board, billing status and admin tables.

### Experience rules
One primary next action on the dashboard. Make progress visible without shaming students for a slower pace. Keep all modules discoverable. Provide clear empty, loading, error, expired access and payment grace states. Mobile first with readable touch targets. WCAG 2.2 AA oriented contrast, labels, focus indicators, keyboard navigation, captions, transcripts and reduced motion. Verify actual color contrast rather than assuming the palette passes. Do not publish fake testimonials or success numbers.

### Copy
Use provided voice and customer reference documents. No emojis, em dashes or en dashes in user facing copy. Avoid revenue guarantees and overclaiming AI automation. State that AI outputs require review and testing. Include supportive, direct, action oriented instructions.

### Owner approvals required
No additional style questionnaire required. Create and test dashboard, audit and lesson layouts in the approved direction. Owner can replace logo and imagery later.

---

## 06 Build sequence and acceptance gates

### Slice 0: Repository and infrastructure
Inspect existing repo; create Next.js TypeScript strict mode app only if not present. Configure lint, tests, CI, Supabase local migrations, environment template, error logging. No production secrets. Exit when clean build and tests run.

### Slice 1: Authentication and authorization
Account creation/login/reset, user profile, admin roles, secure session, RLS and entitlement fixtures. Exit when unauthorized users cannot access paid routes or private rows in direct API and browser tests.

### Slice 2: Catalog and lesson progress
Admin controlled draft/review/published content, eight module navigation, sample lessons, independent learning and milestone progress. Exit when draft assets cannot be viewed by students and progress persists across devices.

### Slice 3: Audit and roadmap
Versioned 30 question form, autosave, deterministic scoring, path recommendation, top three priorities, report and dashboard. Exit when boundary and retake tests pass and no completed work is erased.

### Slice 4: Billing
Stripe test Checkout, one time and six installment products, signed webhooks, idempotent event processing, entitlement expiry and grace logic. Exit when simulated paid, failed, refunded, disputed, canceled and replayed events yield correct grants. Production activation requires owner approval.

### Slice 5: Coaching and community
Calendar, workshop release rules, group access, feedback quota and responses, community moderation. Exit when Blueprint cannot access paid support, feedback caps are enforced server side, and sessions are timezone correct.

### Slice 6: Elite
Application and acceptance, Elite board, private coach notes, private scheduling and 12 hour usage ledger. Exit when cross student access tests fail securely and time accounting is auditable.

### Slice 7: Marketing and admin
Public sales pages, masterclass funnel, admin operations, email templates, analytics and operational dashboards. Use test email recipients only until approved. Exit when published copy and policies are approved.

### Slice 8: Internal QA and release
Test both paths and all three tiers across desktop/mobile; WCAG review; auth/RLS penetration scenarios; Stripe retries; email; backups and recovery; real approved media; all eight modules and six prerecorded workshops; owner signoff. No customer beta substitute.

### Acceptance matrix minimum
- Anonymous -> member route: denied.
- Blueprint -> feedback or Elite route: denied.
- Accelerator -> feedback quota 3 in same cycle: third denied.
- Elite student A -> student B private board or file: denied.
- Audit draft -> logout/login: retained.
- Audit retake -> lesson completion: retained.
- Stripe webhook duplicate/out of order -> no duplicate grants.
- Expired access -> course content denied but account and billing available.
- Published lesson -> video captions resources and completion persist.
- Draft lesson -> student: invisible.
- Mobile keyboard/screen reader: audit usable.
- Paid feature without entitlement -> API returns authorization error, not merely hidden UI.

---

## 07 Claude Code implementation contract (FINAL)

You are the lead full stack engineer for The BOSS Business System. The owner has delegated technical and UX decisions documented in DECISIONS_REGISTER.md. DO NOT begin with another broad questionnaire. Implement the safe defaults and ask only for actual credentials, legal release approvals or an unavoidable material contradiction. Never claim that the portal is live until deployed and tested.

### Required execution
1. Read all eight core handoff files, DECISIONS_REGISTER.md, reference files and canonical Phase 2 sources if provided. Note missing sources explicitly; do not invent their content.
2. Inspect the repository and report existing state. If no repository, initialize a Next.js TypeScript strict application with the agreed stack, tests, linting and CI. Keep `.env.example` without secrets.
3. Write `IMPLEMENTATION_ISSUES.md` and `BUILD_STATUS.md`. Each milestone has changed files, migrations, tests, screenshots and manual verification instructions. Update these on every milestone.
4. Implement in vertical slices from 06_BUILD_SEQUENCE_AND_QA.md. Start with secure auth, RLS, entitlements, a seeded catalog with clearly marked SAMPLE content, audit draft, deterministic scoring and dashboard. Run tests and repair failures before proceeding.
5. Implement billing with Stripe test mode and fixtures, signed webhook verification, idempotency and state reconciliation; never enable live charging without owner approval.
6. Build admin publishing, support and reporting, then coaching, community and Elite features. Protect each with server authorization and Postgres RLS.
7. Use feature flags to keep unapproved or incomplete functionality inaccessible. No fabricated course content, testimonials, customer records or revenue results.
8. Provide reproducible local start commands, migration commands, tests, deployment instructions and exact environment variables. Do not request secrets in chat; direct owner to secure environment settings.

### Definition of done
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass, plus documented E2E flows.
- Unauthorized direct API and database access denied, not merely hidden navigation.
- All pricing, grants, quota limits and calendar rules tested.
- Audit scoring matches canonical 30 question source; if canonical text unavailable, keep audit disabled and implement typed engine/tests with fixtures, not invented question wording.
- Responsive accessible UI, captions and transcripts, published-only resources.
- Admin can manage catalog, entitlements, coaching schedules and support without editing code.
- Production launch remains blocked until owner provides actual credentials, approved legal policies, real approved training and signs off QA.

### First reply to owner
Briefly state what you found, list only truly blocking missing inputs, then propose the first implementation slice and begin work in the repository if execution permission is available. Do not repeat previously resolved product preference questions.
