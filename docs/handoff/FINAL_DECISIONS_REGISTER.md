# Finalized engineering and operating decisions
Decision owner delegated product and technical defaults on 2026-11-01. These are instructions for building the application. Legal, financial account activation, external contracts and production deployment remain owner-controlled release gates, not design questions.

_Copied verbatim from Google Drive folder "BOSS Claude Developer Handoff" (FINAL_DECISIONS_REGISTER.md, 2026-11-01)._

## Decision hierarchy
1. Latest explicit owner instructions and approved offer terms.
2. These finalized decisions, for engineering defaults and previously open technical choices.
3. Phase 2 canonical architecture, 30 question audit and student experience documents.
4. Earlier reference blueprints only where consistent.
Conflicts: preserve the approved business promise; log any irreconcilable conflict in `IMPLEMENTATION_ISSUES.md` with recommended solution, continue on independent work. Do not invent an unapproved paid feature.

## Final decisions (implement without another product questionnaire)
D01 Branding: text wordmark `The BOSS Business System` until supplied logo; use Google Fonts DM Sans (body) and Cormorant Garamond (display) subject to their published open source licenses; tokens dusty rose #E8C8CB, mauve #A56C78, ivory #F7EEE9, plum #65474F; dark ink #30282C and white #FFFFFF for accessible text. No stock people, fake testimonials, crown motifs or gold. Use iconography and simple illustrations. Responsive desktop/mobile; WCAG 2.2 AA target.

D02 Application: Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, React Hook Form and Zod; Supabase Postgres/Auth/Storage with migrations and RLS; Stripe Checkout and Customer Portal; Vercel deployment. Vitest unit/integration, Playwright E2E; GitHub Actions CI. Repository is the source of truth. Use pinned compatible versions and documented install steps; do not overwrite an existing repository without inspection.

D03 Infrastructure: Vercel for hosting, Supabase managed project, Resend for transactional email, Flodesk only for optional marketing automation if a supported integration exists; no required Flodesk integration for launch. Mux for private lesson video playback, signed playback and caption tracks; provider adapters and local mocks in development. Sentry for error reporting with PII scrubbing, Vercel Analytics for aggregate page events with consent as required. Domain remains an environment variable; do not invent or purchase a domain.

D04 Currency and pricing: USD. Blueprint $497 or exactly six $97 payments; Accelerator $1497 or exactly six $297 payments; Elite $4997 or exactly six $897 payments. These installment totals are intentionally higher than pay in full. Graduate group coaching $97/month and separate Elite board retention $97/month. Product prices are server configured and mirrored in Stripe; never trust client totals. Tax calculation: use Stripe Tax only after account configuration and professional review of tax obligations; do not assume tax-exempt or inclusive pricing.

D05 Installments: model as fixed six-payment contractual schedule, not a cancellable monthly membership. Use Stripe Subscription Schedules or a well tested Stripe-supported six invoice schedule with explicit automatic end after sixth successful collection. Distinguish billing schedule from curriculum access and coaching duration. All live product/price IDs come from environment or secure admin config, not hardcoded guesses. Do not auto-charge live cards until Stripe owner setup and approved checkout language.

D06 Entitlements: curriculum access 12 calendar months from first successful purchase payment; six month coaching from same activation for Accelerator and Elite; all eight modules immediately available subject to publication status. Active Graduate Coaching extends curriculum access while active; on its end, original 12 month term applies if not already elapsed. Graduate does not extend private Elite board. Elite board subscription preserves private board access only, not 1:1, feedback, group coaching, DFY or course access. If both add-ons active, grant union of their specific features. Revoke at end of paid period after cancellation, subject to billing grace. Retain read-only billing/account pages.

D07 Failed payments: seven calendar day grace from first failed due date; in grace, show a billing notice and keep previously granted access. At grace expiry, suspend access to paid content and coaching until payment resolves; do not erase work. For disputes/chargebacks, suspend related grant immediately pending manual review. Refunds revoke associated grants after verified Stripe event. Cancellations of month-to-month add-ons take effect at period end. Manual overrides require admin reason and audit log. Do not promise refunds based on implementation alone.

D08 Refund policy: previously selected 14 day action-based guarantee for Blueprint/Accelerator and Elite final sale subject to applicable law. Draft UI text only, clearly marked for legal approval before public publishing. Refund request routed to support/admin with decision recorded. Never automatically deny legally required refunds. Contact email is configurable and required before production.

D09 Accounts and permissions: Supabase email/password plus email verification and password reset; optional magic link after secure implementation. Roles student, assigned coach, admin. Admin role assigned only through server-managed allowlist/DB; no public self-promotion. Coach can read assigned clients and coaching sessions, never unrelated Elite work. Entitlements are server generated from signed Stripe events or audited admin overrides. Enforce RLS on all student data, storage and privileged mutations.

D10 Community: build first party simple threaded posts/comments with reporting, hide/unpublish, coach/admin moderation and basic rate limits; no DMs, external public indexing or student email exposure. Available to Accelerator/Elite during coaching and Graduate while subscribed. Deleted posts hidden immediately and purged per retention policy.

D11 Feedback: two submissions per monthly coaching cycle, no rollover, each one deliverable, response target three US business days excluding published holidays. Cycle begins at coaching activation date and repeats on monthly anniversaries. Server transaction/unique quota enforcement; timestamps in UTC, display America/New_York by default. Coach/admin can respond; graduate excluded.

D12 Coaching: group Wednesdays 1 PM America/New_York for 60 min; Hot Seat second Tuesday 1 PM for 90 min; Hot Seat applications close first Tuesday 1 PM; selection communicated within 48h. Two prerecorded workshops publish first and third Mondays monthly. Elite weekly private 60 min, 24h rescheduling policy; personal audit within seven business days of complete inputs; 12 DFY hours, tracked in minute ledger. Meeting URLs private. Holiday schedule: admin can cancel/reschedule individual sessions with notification; do not auto-create sessions on holiday exceptions without admin approval. Do not promise a specific meeting provider integration: store admin managed join links initially.

D13 Roadmap: six thematic months are advisory, no deadline locks. Audit retakes never overwrite progress. Admin may override priorities and student may choose either path; persist override reason/time. No AI deciding audit scores. Module 2 to 8 recommendations use approved category-to-module mapping and first published essential lesson until exact per-question lesson mapping is authored. Label these category-level recommendations clearly, never fabricate specific mappings. No N/A audit answers in v1 because no verified eligibility rules exist; all 30 questions required. This prevents inconsistent scoring until a future approved audit version defines N/A.

D14 Content: statuses draft, review, approved, published, archived. Only published content visible to entitled students. Admin publishes; coach can suggest edits but not publish. Video captions/transcript required before publish, downloadable worksheets checked, no sample media publicly visible. Both paths use shared eight modules; path-specific callouts only where authored.

D15 Security/privacy: collect minimum necessary PII; no DOB, sensitive demographics or financial account data; store no raw payment card data. Student uploads private and scanned/validated for type and size, signed download links expire after five minutes. Session cookies secure and httpOnly where applicable. Audit logs for entitlement changes, billing exceptions, admin actions. Retain application audit responses and progress while account active; offer verified deletion workflow with 30 day processing target unless law/contract requires longer. Keep financial invoices and Stripe references for legally required retention; privacy policy needs legal approval. Backups daily with documented restore drill, production RPO 24h and target RTO 24h, validated before launch.

D16 Emails: Resend for account verification, purchase access, billing issues, coaching notices and feedback response. Marketing emails optional, separate opt-in and consent log; no automatic marketing subscription from purchase. Email templates and sending domains must be verified before live use. In test, send only to allowlisted addresses.

D17 Analytics: track anonymized funnel events, audit completion, lesson completion, resource downloads, access errors and subscription status changes. Never send audit answers, private feedback or student content to analytics. Cookie/consent behavior configured for jurisdiction and legal review.

D18 QA/release: all three tiers, both paths, graduate and board add-ons, failed payments, refunds, RLS, mobile, accessibility, backups, security review and full content readiness must pass. No customer beta. Do not deploy production or activate real billing/emails without explicit owner approval.

## Information still required as configuration, not strategic decisions
The owner must supply or create accounts/keys for Supabase, Stripe, Vercel, Mux, Resend and optionally Sentry; confirm domain and support contact; approve final published terms, privacy, refund and payment language; supply real videos, captions, worksheets, workshop content and final branding assets. Never fabricate these. Use `.env.example` placeholders and mock providers until credentials exist.

## Engineering change control
Record departures in `IMPLEMENTATION_ISSUES.md` with source, impact, chosen default and test. Technical refinements can be made without new owner interviews if they preserve policy, security and price. Security/legal/financial material changes require owner signoff before production.
