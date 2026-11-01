# CLAUDE.md
# The BOSS Business System: Complete Claude Code Engineering Guide

## 0. Your assignment

You are the lead product engineer, architect, accessibility reviewer, security engineer, and QA partner for **The BOSS Business System**, the premium education and coaching program under **Boss Lady Bloggers**.

Build a production-grade, custom, responsive web application, not a mockup or a generic course template. The product includes a public marketing website, member learning portal, onboarding audit, community, coaching hub, feedback workflow, Elite collaborative client boards, administration, payments, and evergreen launch funnel.

**Source of truth order**
1. `docs/BOSS_Master_Blueprint_Reference.txt` for finalized business decisions.
2. `docs/offer.md`, `docs/customer.md`, `docs/voice.md`, `docs/about.md` for brand, audience, and copy.
3. This `CLAUDE.md` for engineering and implementation rules.
4. Explicit written owner approvals for unresolved decisions.

If these sources conflict, flag the conflict in `docs/DECISIONS.md`. Do not silently invent a new business policy.

**Critical:** This project is NOT ready for public launch until every advertised feature and all eight modules plus six workshops are complete, secure, and tested. January 30, 2027 is a movable target, not a mandatory release date. Do not implement a customer beta as a substitute for the finished program.

## 1. Working style and execution contract

1. First inspect the repository, existing files, package manager, environment configuration, and git status. Preserve existing work.
2. Read the reference files listed above before changing application behavior or copy.
3. Produce `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/ENTITLEMENTS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/QA_MATRIX.md`.
4. Build in vertical slices. Each slice must have database migration, authorization, frontend, validation, tests, and documentation.
5. For each slice, summarize implemented files, migrations, tests run, security considerations, and owner actions required.
6. Do not claim something works unless it was tested. Do not mark a feature complete if it uses fake data or unimplemented buttons.
7. Do not invent credentials, service IDs, domains, Zoom links, email addresses, legal language, testimonials, income guarantees, or pricing.
8. Never use real payments or send customer email while developing. Use test environments and clearly labeled fixtures.
9. Stop and request approval before destructive database migrations, production deployments, enabling live Stripe mode, sending bulk email, or changing customer entitlements in production.
10. Prefer maintainable, readable TypeScript and explicit schemas over complicated abstractions.
11. Use the brand voice files for all customer-facing writing. No emojis. No em dashes or en dashes in copy. Avoid jargon, filler, hype, and guaranteed income claims.
12. Update `docs/PROGRESS.md` after each development session with what works, what is blocked, and the next three concrete steps.

## 2. Suggested technology stack

Use a custom TypeScript web application built with **Next.js App Router**, React, Tailwind CSS, and accessible UI primitives (for example shadcn/ui). Use **Supabase PostgreSQL**, **Supabase Auth**, **Supabase Storage**, and database Row Level Security. Use **Stripe Checkout, Billing, and signed webhooks**. Use a supported transactional email service and approved marketing email service after owner selection. Use **Zoom** for scheduled coaching; store approved meeting URLs and recordings or provider-hosted links, not meeting passwords in public fields.

This is a recommended implementation, not an already approved vendor selection beyond Claude Code, Supabase, and Stripe. Hosting, email, video storage, analytics, monitoring, and scheduling providers remain to be approved.

Engineering standards:
- TypeScript strict mode; Zod validation at trust boundaries.
- Server-side authorization on every protected read, write, file download, and action.
- Supabase migrations under version control, with RLS policies and automated authorization tests.
- Accessible WCAG 2.2 AA-oriented forms, contrast, keyboard navigation, labels, focus management, and captions/transcripts.
- Mobile-first layouts, performant images, clear loading/empty/error states, and reliable form drafts.
- Secure secret management, no service-role keys in browser bundles, no raw card data stored.
- Background jobs or scheduled functions for reminders, entitlement expiry, and email; design for retries and idempotency.
- Audit logs for administrative and billing-sensitive actions.
- Rate limiting and abuse controls for authentication, uploads, comments, and public forms.
- Database backups, recovery tests, storage lifecycle policy, error monitoring, and incident runbook.
- CI checks: lint, typecheck, unit tests, integration tests, build, and browser smoke tests.

## 3. Product map and routes

### Public website
- `/` premium marketing home, positioning, program overview, paths, founder, testimonials only if approved and genuine, CTA.
- `/program` comprehensive program sales page with eight modules, BOSS phases, deliverables, support differences, FAQs, policies, tier comparison.
- `/pricing` three-tier pricing and payment options.
- `/masterclass` registration for prerecorded 40 to 50 minute on-demand training.
- `/masterclass/watch` protected by registration token or account session; video, resources, program CTA.
- `/apply/elite` Elite application; `/apply/elite/confirmation`.
- `/login`, `/signup`, `/forgot-password`, `/privacy`, `/terms`, `/refund-policy`, `/contact`.
- Optional blog/content pages and SEO metadata without manufacturing claims or reviews.

### Member portal
- `/app` personalized dashboard, learning path, next three actions, coaching eligibility, progress.
- `/app/start` welcome video, Getting Started Guide, onboarding checklist.
- `/app/audit` comprehensive audit, resume draft, results and history, PDF download.
- `/app/learn` eight modules, phase navigation, lessons, video/transcripts, resources, assignments.
- `/app/library` searchable Implementation Library with filters and contextual links.
- `/app/ai-tools` external ChatGPT/Claude assistant links, editable prompt templates, usage instructions.
- `/app/progress` milestones, optional link/file submissions, six-month recommended roadmap.
- `/app/workshops` prerecorded workshop library with active-coaching entitlement.
- `/app/coaching` calendar, Zoom sessions, advance questions, recordings, Hot Seat applications.
- `/app/community` single feed, posts, threaded replies, reactions, tags, search, attachments, pinned notices, notification preferences.
- `/app/feedback` submission quota, upload/link, status, response and turnaround details.
- `/app/elite` custom private collaborative board, weekly check-in, personal audit, roadmap, deliverables, requests, hours ledger.
- `/app/billing` Stripe customer portal handoff, active products, billing status, invoices, subscription cancellation.
- `/app/settings` profile, accessibility preferences, notifications, account/data requests.
- `/app/support` help and refund request form with email fallback.

### Administration
- `/admin` operational overview, not exposed to customers.
- `/admin/content` modules, lessons, workshop releases, library, resources.
- `/admin/members` member status, entitlements, audit summary only with appropriate permission.
- `/admin/coaching` sessions, Hot Seat selection, applications, replays, consent.
- `/admin/feedback` queue, monthly quotas, SLA due dates.
- `/admin/elite` applications, private audits, board provisioning, requests, hours, extra packages.
- `/admin/community` moderation, reports, pinned posts.
- `/admin/billing` read-only Stripe-linked payment state, refunds through controlled approved workflow.
- `/admin/operations` event logs, webhook delivery failures, scheduled jobs, export requests.

Do not make the entire portal dependent on a single huge page. Build coherent navigation, reusable components, and route-level authorization.

## 4. Identity, roles, and entitlements

Use separate concepts for **identity**, **purchase**, **payment obligation**, **coaching period**, **content access period**, **subscription**, and **Elite board access**. Do not encode all permissions as one mutable `tier` string.

Roles: `guest`, `member`, `coach`, `support_admin`, `super_admin`. Business entitlements: `blueprint_core`, `accelerator_coaching`, `elite_coaching`, `graduate_coaching`, `elite_board`, `launch_kit`, plus purchase-derived content windows.

**Blueprint**
- $497 paid in full OR six committed installments of $97.
- All eight self-paced modules, templates, AI assistant resources, Implementation Library.
- Core curriculum access for 12 months from enrollment.
- No coaching, community, workshop access, feedback submissions, 1:1, or DFY.

**Accelerator**
- $1,497 paid in full OR six committed installments of $297.
- Blueprint plus six months weekly group coaching, community, two new prerecorded workshops monthly, monthly Hot Seat, two personalized feedback submissions per member monthly coaching cycle, Tue/Thu community support.
- Full existing workshop library and coaching replays while coaching entitlement active.
- No 1:1 and no DFY.

**Elite**
- $4,997 paid in full OR six committed installments of $897.
- Accelerator plus six months weekly fixed 60-minute private coaching, personal audit, custom roadmap, collaborative board, 12 total included DFY technical implementation hours.
- Maximum five active Elite clients.
- Application, discovery call, approval, THEN checkout.
- Included hours usable for six months plus 30 days; subject to applicable law.
- Weekly check-in due at least 24 hours before each private call.

**Graduate coaching membership**
- Optional $97/month after six-month program.
- Weekly group coaching, community, two new monthly workshops, monthly Hot Seat, Tue/Thu support and coaching replays.
- No personalized feedback submissions, private 1:1, or DFY.
- Extends core curriculum beyond original 12 months only while active.
- Cancellation effective at end of paid period.

**Elite board subscription**
- Optional separate $97/month after six months to retain custom board access.
- No coaching or DFY; does not extend core curriculum.
- On cancellation: access ends at paid period end; 30-day window to request export, 90-day secure inactive retention for reactivation, subject to law and finalized privacy policy.

**Access calculation**
Implement an entitlement resolver as server-side business logic, derived from trusted payment records and dated grants. Test exact boundaries and time zones. Installment commitments are NOT cancel-anytime subscriptions. A failed installment has a seven-day grace period with continued access, then suspension if still unpaid; restoration on cure does not reset original term dates. Refund-approved purchases revoke associated benefits when refund is initiated, with a supported process for retrieving customer-owned records.

## 5. Onboarding and business audit

After verified purchase:
1. Provision account or safely link existing account.
2. Show branded welcome, welcome email, and Getting Started Guide.
3. Present a 20 to 30 question self-reported business audit across ten categories: foundations, audience and messaging, website/blog, content, digital products, email/sales, Pinterest/social, AI/automation, productivity, obstacles/priorities.
4. Support save draft, resume, retake, and historical comparison.
5. Calculate structured rules-based category scores, strengths, gaps, top three priorities, recommended `Build From Scratch` or `Optimize & Automate` path, relevant modules, and six-month recommended roadmap.
6. Render report in dashboard and downloadable branded PDF.
7. Display first three implementation steps, not a giant intimidating checklist.

No embedded LLM inference or income verification in audit scoring. Keep questions, scoring weights, thresholds, and recommendations in a versioned and testable configuration. Clearly label findings as based on self-reported responses.

Elite gets a separate **human-conducted** comprehensive audit, interactive custom roadmap, and branded PDF within seven business days after all required inputs are received. Review during an existing private session; update roadmap monthly.

## 6. Curriculum and learning experience

Official BOSS phases: **Build, Optimize, Systemize, Sell**. Preserve eight modules:
1. Business Foundation
2. Brand & Website
3. Content Production Engine
4. Marketing & Distribution
5. Digital Product Development
6. Email & Sales Systems
7. AI & Automation Hub
8. CEO Productivity System

Each module supports sections, lessons, video, transcript, downloadables, assignments, outcome, milestones, and contextual Implementation Library links. Typical lessons 5 to 15 minutes, talking head plus screen recording. Entire curriculum immediately accessible, no drip or forced unlocking. Progress is self-marked; optional file/link evidence is stored privately. Do not claim submitted milestones are automatically reviewed.

Two suggested journeys:
- **Build From Scratch:** offer, customer, messaging, site, email, content, distribution, sales, systems.
- **Optimize & Automate:** audit, refine offer, improve site/conversions, content, distribution, email/sales, AI automation, operations.

Use the same eight modules and vary recommended ordering, not duplicate lesson libraries. Include six-month suggested implementation timeline without imposing progression locks.

Create a searchable separate Implementation Library with software tutorials, AI prompts, assistant templates, recipes, and walkthroughs. External ChatGPT/Claude assistant links only. Explain third-party subscription costs where relevant.

Six prerecorded 30 to 60 minute workshops must exist before public launch. After launch release two new workshops monthly on the first and third Monday. Plan topics quarterly. Access limited to active coaching entitlement.

## 7. Coaching, community, and feedback

Weekly group coaching: Wednesdays 1 PM Eastern, 60 minutes, Zoom, advance questions plus live Q&A.

Monthly Hot Seat: second Tuesday 1 PM Eastern, 90 minutes. Applications close first Tuesday 1 PM Eastern. Notify applicants within 48 hours. Unselected applications carry forward and can be edited/withdrawn. Select based on readiness, feasibility, learning value, and impact. Require explicit recording consent and protection/redaction of confidential data.

Coaching Hub: schedule, links, reminders, replay library. Replays available only during active coaching, not merely during 12-month curriculum access.

Community: one searchable feed with posts, threaded comments, likes, images/files, pinned announcements, tags, and configurable portal/email notifications. Support response days Tuesdays and Thursdays; do not imply 24/7 support.

Feedback: Accelerator and Elite get two personalized submissions per member monthly coaching cycle. Each submission covers one deliverable. Unused credits expire, no rollover. Dedicated form, files/links, status, coach response written or screen recording within three business days. Graduate members receive none.

## 8. Elite collaborative boards and DFY hours

Each Elite client receives an isolated custom board containing:
- Client-specific six-month roadmap and monthly revisions.
- Tasks, priorities, due dates, comments, files, deliverables, progress.
- Private audit dashboard and PDF.
- Weekly four-question check-in: accomplishments, challenges, next week's top three priorities, help needed. Due 24 hours before 1:1, reminders, completion enforcement.
- Implementation request intake, scope, estimated deadline, status, completion summary, **actual time recorded after work**.
- Included hours ledger: 12 total; show hours used and remaining. Coach independently allocates and tracks time without per-request hour approval, never exceeding purchased allowance without explicit additional package purchase.
- Extra packages: 3 hours $450; 5 hours $700; 10 hours $1,300, prepaid, scoped, expire three months after purchase subject to law.
- Six-month coaching expiration plus 30-day included-hour usage extension.
- Optional board subscription and secure export/retention workflow.

Private calls have a fixed recurring weekly 60-minute slot, 24-hour rescheduling notice. Late cancellations/no-shows are forfeited; coach-cancelled appointments are replaced. Finalize any ambiguous missed-check-in operational edge case with owner rather than guessing.

## 9. Stripe implementation rules

Use Stripe test mode until explicit owner approval. Create catalog mapping from configuration and Stripe IDs. Do not hardcode live IDs in source.

Offer prices:
- Blueprint PIF 497 USD, installment 6 x 97 USD.
- Accelerator PIF 1497 USD, installment 6 x 297 USD.
- Elite PIF 4997 USD, installment 6 x 897 USD.
- Graduate coaching 97 USD monthly.
- Elite board 97 USD monthly.
- Extra DFY packages 450 / 700 / 1300 USD.

A six-payment plan must **stop after exactly six successful scheduled installments**, not become an indefinite subscription. Design and test this explicitly using supported Stripe Billing mechanisms or an approved equivalent; verify behavior in Stripe's current API version. Handle failed payments, retries, late payments, race conditions, duplicate and out-of-order webhooks. Store Stripe event IDs for idempotency. Verify webhook signatures server-side. Never trust a redirect success page as proof of payment.

Refund workflow: Blueprint and Accelerator 14-day action-based guarantee with onboarding, audit, and attempted first assignment, subject to applicable law. Elite sales final after enrollment subject to legal rights and nondelivery remedies. Refund request portal form, manual review within three business days, email alternative if locked out. Owner must approve legal terms before publication.

Elite application approval must be server-side enforced; a public checkout URL alone cannot bypass approval.

## 10. Launch masterclass and funnel

Masterclass: **How to Build a Profitable Blog Business with Digital Products, AI, and Automation**.
Prerecorded, on demand, 40 to 50 minutes. Teach the four BOSS phases and transition to program invitation. Build registration, consent, video delivery, follow-up sequence, CTA, attribution, and basic analytics. Do not invent results or scarcity.

Limited launch-week bonus: **BOSS Business Launch Kit** with 30-day action plan, AI starter prompts, digital product planning templates, content/marketing planner, and setup checklist. Grant automatically only to eligible purchases during a real, published bonus window. After bonus ends, keep evergreen enrollment open.

Create responsive sales page and tier comparison with clear boundaries. Promote through existing channels including blog, Pinterest, YouTube, podcast, Facebook group, Instagram, and email. Marketing automation requires opt-in and unsubscribe compliance.

## 11. Data model requirements

Design normalized tables and relationships for at least:
`profiles`, `roles`, `purchases`, `payment_obligations`, `payment_events`, `subscriptions`, `entitlement_grants`, `access_audit_logs`, `products`, `pricing_plans`, `elite_applications`, `audit_question_sets`, `audit_questions`, `audit_responses`, `audit_reports`, `audit_scores`, `learning_paths`, `modules`, `lessons`, `lesson_resources`, `lesson_progress`, `assignments`, `milestones`, `member_milestones`, `library_items`, `ai_assistant_resources`, `workshops`, `workshop_releases`, `coaching_sessions`, `coaching_questions`, `session_replays`, `hot_seat_applications`, `hot_seat_consents`, `community_posts`, `community_comments`, `reactions`, `notifications`, `feedback_allowances`, `feedback_submissions`, `feedback_responses`, `elite_boards`, `elite_board_members`, `elite_tasks`, `elite_task_comments`, `elite_weekly_checkins`, `elite_audits`, `elite_roadmaps`, `implementation_requests`, `implementation_time_entries`, `hour_packages`, `hour_balances`, `attachments`, `refund_requests`, `export_requests`, `retention_events`, `admin_audit_logs`, `email_events`, `webhook_events`.

These are conceptual entities, not mandatory table names. Prefer sensible consolidation where it improves integrity. Use database constraints, foreign keys, timestamps, versioned policies, and soft-delete/retention rules where appropriate.

RLS must enforce: members can read their own private data; Elite boards visible only to the specific client and authorized staff; coaching content only to active coaching entitlement; no cross-member audit/report/file leakage; admin actions logged. File storage needs private buckets, short-lived signed URLs, content-type and size restrictions, and authorization checks.

## 12. Visual design system

Premium feminine editorial, modern, spacious, sophisticated, easy to navigate, not overly decorative.
Preliminary palette:
- Dusty rose `#E8C8CB`
- Muted mauve `#A56C78`
- Soft ivory `#F7EEE9`
- Deep plum `#65474F`

Use an editorial serif for headings and clean sans serif for body, with properly licensed web fonts. Build reusable tokens, cards, forms, navigation, empty states, tables, video players, and progress UI. Brand identity includes BOSS wordmark and interlocking BOSS monogram; use placeholders until actual approved assets exist. Maintain contrast and legibility, especially on dusty rose backgrounds.

Tone: warm, specific, practical, not corporate. Never invent testimonials, student results, or guaranteed profits. Prioritize mobile use and low cognitive load. Dashboard should surface only the next meaningful actions.

## 13. Implementation phases and acceptance gates

### Phase 0: Discovery and architecture
- Inspect repository and references; list open decisions.
- Create route map, entity relationships, entitlement matrix, security threat model, release checklist.
- Set up CI, environment variable templates, staging project and test fixtures.
- Owner reviews architecture before expensive build work.

### Phase 1: Foundation and identity
- Design system, shell, navigation, public pages, authentication, user profiles, Supabase schema and RLS.
- Tests: login, reset, session expiry, unauthorized access, mobile/keyboard navigation.

### Phase 2: Commerce and entitlements
- Stripe test catalog, six-installment lifecycle, one-time purchase, subscriptions, verified webhooks, member provisioning.
- Tests: six payments stop, failure grace, cancellation, refund, duplicate webhook, tier changes, Elite approval gating.

### Phase 3: Core learning and onboarding
- Content CMS, eight-module rendering, progress, two paths, audit/report/PDF, Implementation Library, AI links, six workshops.
- Tests: self-paced access, versioned scoring, report history, private uploads, tier access.

### Phase 4: Coaching and community
- Session calendar, Zoom details, replay library, Hot Seat application and consent, community, feedback quota and response workflow.
- Tests: eligibility, monthly reset, expired coaching, notification preference, moderator permissions.

### Phase 5: Elite experience
- Application and approval, personal audit, private boards, weekly check-ins, hour ledger, paid packages, board subscription, export.
- Tests: client isolation, 12-hour cap, actual time logging, renewal/cancellation, retention, 5 active-client cap.

### Phase 6: Marketing and evergreen funnel
- Sales page, pricing, masterclass, registration, email automation, launch kit entitlement, Elite application, attribution.
- Tests: complete prospect-to-purchase journey and bonus eligibility boundaries.

### Phase 7: Content production and launch readiness
- All eight modules fully authored, recorded, edited, reviewed, and uploaded.
- Six workshops fully produced.
- Run accessibility, security, functional, billing, privacy, and load tests.
- Perform private internal QA with test accounts. **No paid beta.**
- Owner signs off all promised features and live Stripe readiness.
- Only then launch, regardless of target date.

**Capacity warning:** At 10 to 20 founder hours weekly, this is a large application and content production effort. Give realistic work estimates and call out scope/timeline conflicts. Do not silently downgrade promised features.

## 14. Required test matrix

Maintain `docs/QA_MATRIX.md` with test cases for:
- Anonymous visitor vs authenticated Blueprint/Accelerator/Elite/graduate/board-only member.
- Enrollment, initial access, 12-month expiry, 6-month coaching expiry, graduate continuation, board-only continuation.
- Full payment vs six installments, exact final installment, failed payment seven-day grace, overdue suspension, cure, refund.
- Elite application approval bypass prevention and maximum five active clients.
- Audit save/resume/retake, scoring, historical comparison, PDF rendering, privacy.
- Progress milestones and attachment permissions.
- Workshop access before/after coaching period.
- Coaching replays, Hot Seat consent and carry-forward applications.
- Feedback allowance per monthly cycle, non-rollover, SLA tracking.
- Community post moderation, attachments, search, notifications, spam protection.
- Elite board cross-client isolation, weekly check-in timing, hour accounting, extra packages, export and retention.
- Masterclass registration, emails, CTA, real launch bonus expiration, evergreen checkout.
- Keyboard/screen reader flow, mobile widths, empty/error states, broken links, image optimization.
- Backups, recovery, error reporting, signed URL expiry, webhook replay/idempotency.

## 15. What to do first in Claude Code

When this guide is first loaded, DO NOT immediately generate hundreds of files.

1. Read all source files and inspect repository.
2. Summarize product scope and open implementation choices.
3. Propose the precise initial framework, hosting, email/video vendors, and why.
4. Draft schema, RLS plan, route tree, entitlement state machine, milestone plan, and estimates.
5. Identify high-risk issues: six-payment billing, access expiry, Elite privacy, refund rights, content production capacity.
6. Ask owner approval for architecture and unresolved vendor choices.
7. Then implement Phase 1 in small, fully tested increments.

**First prompt to run after adding this file:**

> Read CLAUDE.md and every file in docs. Inspect the repository. Do not write application code yet. Create the architecture, database entity map, entitlement matrix, route tree, security model, dependency-ordered build plan, QA matrix, and open decisions list. Highlight any conflict with the finalized blueprint and estimate the build scope. Then tell me the first implementation slice and wait for my approval.
