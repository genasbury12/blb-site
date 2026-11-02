# BUILD_STATUS.md

Status of The BOSS Business System portal build. Updated at every milestone (contract step 3).
**Nothing is deployed. Nothing is live.** No real credentials, payments, or emails have been used.

## Where things stand
| Slice (handoff 06) | State |
|---|---|
| 0 Repository and infrastructure | Done |
| 1 Authentication and authorization | Built and tested at the database and route level. Signed in browser journeys wait on a Supabase test project (I-23) |
| 2 Catalog and lesson progress | Built: admin publishing workflow, lesson editor, milestones, private downloads, Mux signed playback, Implementation Library |
| 3 Audit and roadmap | Built, including the PDF report |
| 4 Billing | Built in Stripe test mode; live verification needs a Stripe test account |
| 5 Coaching and community | Built |
| 6 Elite | Built |
| 7 Marketing and admin | Admin workspace complete; public sales and masterclass pages wait on approved copy and video |
| 8 Internal QA and release | Staging Supabase project created and migrated (2026-11-02); test accounts, auth settings, Vercel and Stripe test mode pending; owner sign off pending |

## Milestone 7: Admin completion, design polish, launch readiness docs (2026-11-02)

### What works (tested)
- Students and access: account directory with search (admin), coach view of assigned members, per student access with grant, suspend, or revoke and a required reason, purchases, audit history, progress, coach assignments, coach role (admin role remains script only).
- Audit log viewer with filters.
- Redesigned dashboard (time of day greeting, featured next action, roadmap and progress, numbered priorities, This week panel for coaching, feedback, Elite, community) and editorial headers across every member page.
- `npm run provision:test-accounts`: creates admin, coach, Blueprint, Accelerator, Elite, and no access accounts on a staging project through the real billing path, prints passwords once, refuses production.
- Owner documentation: `docs/OWNER_SETUP.md` (exact links and clicks), `docs/FEATURE_CHECKLIST.md`, `docs/LAUNCH_REVIEW.md`.

### Tests run
| Command | Result |
|---|---|
| lint, typecheck, check:copy, build | pass |
| `npm test` | 232 pass (25 files) |
| `npm run test:e2e` | 44 pass, 4 signed in journeys skipped pending staging |

### Screenshots
`docs/screenshots/m7-*.png`

## Milestone 6: Elite (2026-11-02)

### What works (tested)
- Public Elite application (behind the Elite flag) with honeypot and per email rate limit; staff move applications through reviewing, discovery call, accepted, declined; accepting holds a seat for 14 days and is refused when all five seats are in use (active clients plus held offers, under a lock).
- Checkout for Elite opens only for the accepted applicant, matched by account email; payment enrolls the application and provisions the private workspace with a 720 minute included allowance automatically.
- Private workspace: next private session with join link, cancel (24 hours or more ahead is a reschedule, later is forfeited), weekly four question check-in due 24 hours before (late submissions flagged), custom six month roadmap, tasks and deliverables, coach led audit, shared files, done for you requests with scope, estimate and completion summary, hours meter and time ledger.
- I-11: after coaching ends, the client keeps requests and hours only until the hours expire.
- Staff: capacity, application pipeline, client list with hours left, coach assignment (admin), roadmap, audit, tasks, coach only notes, requests, time recorded after the work (append only, never above the allowance, admins can void with a reason), packages recorded by admin with a payment reference, weekly session scheduling, coach cancellation with replacement, check-in review, file sharing.
- Isolation: client A cannot read client B's board, items, files, sessions or hours; coaches see only boards assigned to them; coach notes are never visible to clients.

### Tests run
| Command | Result |
|---|---|
| lint, typecheck, check:copy, build | pass |
| `npm test` | 231 pass (25 files) |
| `npm run test:e2e` | 44 pass |

## Milestone 5: Coaching hub, workshops, Hot Seat, feedback, community (2026-11-02)

### What works (tested)
- Coaching Hub: upcoming sessions with private join links (coaching members only), advance questions, cancellation notes, replay library that disappears when coaching ends.
- Workshops: released and published only, Mux video with captions, transcript.
- Hot Seat: application for the right month (closes 1 PM Eastern on the first Tuesday, enforced in the database), explicit recording consent, confidentiality requests, edit or withdraw before the close, staff select, not this month, or carry forward, member email notification (suppressed until email is approved).
- Feedback: two submissions per monthly cycle from coaching activation, enforced in a locked database transaction, no rollover, withdrawal frees a slot before review, response due in three business days excluding published holidays, optional private file and link, staff respond in writing or with a recording link, member notified.
- Community: feed with tags and pinned announcements, one level threaded replies, own post deletion, reports, staff hide, restore, remove, pin, rate limits, first names only (never emails).
- Admin: session scheduling (generate weeks of Wednesday drafts skipping holidays, Hot Seat sessions, manual sessions, cancel with note), Hot Seat decisions, workshop library with release date helper, feedback queue with due and overdue counts, moderation with reports, published holidays.
- Email adapter for Resend: sends nothing unless enabled, allowlist only outside production.

### Tests run
| Command | Result |
|---|---|
| lint, typecheck, check:copy, build | pass |
| `npm test` | 219 pass (24 files) |
| `npm run test:e2e` | 41 pass |

## Milestone 4: Stripe billing in test mode (2026-11-02)

### What works (tested)
- Plans page with the approved prices and transparent six payment totals; checkout for Blueprint and Accelerator (pay in full or six payments), Elite after acceptance, Graduate and Board retention for eligible members (billing deferred until coaching or board access ends). No live payments: live keys are refused without explicit approval.
- Signed webhook endpoint `/api/stripe/webhook`: signature verification over the raw body, live mode events refused, event ledger with duplicate suppression and retry on failure, one idempotent SQL command per event.
- Order independent payment ledger: installments counted from distinct paid invoices; invoices arriving before checkout completion are linked later; a paid invoice never reverts to failed; stop after the sixth payment; seventh payment flagged.
- Failed payments start the seven day grace; cure restores without resetting dates; disputes suspend immediately (won restores, lost revokes); full refunds revoke; partial refunds go to review.
- Graduate and board memberships: periods synced from subscription events, cancel or resume at period end from the Billing page, Stripe customer portal for payment methods and invoices.
- Admin Payments: Stripe price ID mapping (approved amounts locked), review queue for exceptions with resolution notes, recent orders, webhook event log.
- Draft legal pages clearly marked pending legal review.

### Tests run
| Command | Result |
|---|---|
| lint, typecheck, check:copy, build | pass |
| `npm test` | 196 pass (22 files) |
| `npm run test:e2e` | 40 pass |

### Needs credentials to verify live
A Stripe test account: create test prices, paste their IDs in Admin, Payments, add the webhook endpoint, and run the Stripe test clock scenarios in `docs/OWNER_SETUP.md`.

## Milestone 3: Admin curriculum, storage, video, PDF, design shell (2026-11-02)

### What works (tested)
- Decisions recorded for I-07, I-08, I-09, I-11; I-16 moved to `docs/FUTURE_MARKETING_CLEANUP.md`; provisional copy register `docs/COPY_REVIEW.md`.
- Premium editorial shell shared by member and admin areas: monogram placeholder, icon navigation, no JavaScript mobile menu, editorial page headers with ornament, layered cards, editorial numerals. New text tokens contrast tested.
- Admin workspace (`/admin`, 404 for non staff): overview with connected services, curriculum list, module settings and milestones, lesson editor (all fields, Mux playback id, captions flag, transcript, AI prompt and assistant link, path callouts), D14 status workflow (draft, review, approved, published, archived) enforced in code and database, downloads upload with type, size and content checks, check then publish, coach edit suggestions, Implementation Library editor.
- Automatic audit trail on every staff content change (`app.audit_row_change`), and a guard so approved prices cannot be edited from the app (Stripe price IDs can).
- Members: Implementation Library with search and filters, redesigned lesson page (Mux player when configured, path callout, AI prompt copy, downloads), PDF audit report download.
- Private storage buckets (Supabase) with 5 minute signed links issued only after the member's RLS query returns the row.

### Tests run
| Command | Result |
|---|---|
| lint, typecheck, check:copy, build | pass |
| `npm test` | 161 pass (18 files) |
| `npm run test:e2e` | 36 pass, signed in journeys skipped pending Supabase test project |

### Needs credentials to verify live
Supabase Storage uploads and downloads, Mux playback.

## Milestone 2: First vertical slice UI (2026-11-01)

### What works (tested)
- Design system from D01: Cormorant Garamond and DM Sans, brand tokens with measured contrast, skip link, visible focus, reduced motion.
- Auth: sign in, sign up with email confirmation, forgot and reset password, email link handler, sign out. Generic error messages (no account enumeration), open redirect protection on `next`.
- Proxy refreshes sessions and sends signed out visitors from `/app` and `/admin` to sign in. Every page and server action authorizes again, and Postgres RLS is the final boundary.
- Member area: dashboard (one next action, top three priorities, learning and milestone progress shown separately, roadmap month, access dates, billing grace notice), audit (eight sections, 30 questions, autosave each answer, Back and Resume, review, submit), report (scores, path, strengths, priorities with reasons and lessons, six month roadmap, path choice, history), training (eight modules, lessons, mark complete, next lesson, SAMPLE badges, missing video state), roadmap (done toggles, earlier completed items kept), account (name, access table with dates, purchases).
- Atomic audit submission (`record_audit_submission`, service role only): run, roadmap items, onboarding state, and draft consumption commit together or not at all.
- States: loading, empty, no access or expired, payment grace and suspension, missing media, save failure with retry, error boundary.

### Changed files
`portal/src/app/**` (auth pages, member pages, preview), `portal/src/components/**`, `portal/src/lib/{supabase,server,validation}/**`, `portal/src/proxy.ts`, `portal/src/domain/audit/{submission,labels}.ts`, `portal/supabase/migrations/20261101000500_audit_submission.sql`, `portal/tests/**`.

### Tests run
| Command | Result |
|---|---|
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run check:copy` | pass |
| `npm test` (unit + database authorization) | 141 tests pass (12 files) |
| `npm run build` | pass |
| `npm run test:e2e` (desktop and mobile Chromium) | 34 pass, 4 signed in journeys skipped pending Supabase test project |

### Screenshots
`docs/screenshots/m2-*.png`: home, sign in, sign up, and the fixture preview (dashboard pieces, audit stepper, report), at desktop and mobile widths.

### Manual verification
1. `cd portal && npm ci && npm run build && npm start`, then open `/preview` for the audit and report with fixture data.
2. Open `/app` signed out: you land on `/login?next=%2Fapp`.
3. With a Supabase test project: set the env values, `npx supabase db push`, run `supabase/seed.sql` against the TEST project only, create a confirmed account, grant it with `select public.admin_grant_entitlement(...)` as an admin or by inserting a paid order with the service role, then sign in and walk dashboard, audit, report, training, and account.


## Milestone 1: Slice 0 foundation, data layer, and domain engines (2026-11-01)

### What works (tested)
- Next.js 16.4 App Router app in `portal/`, TypeScript strict (`noUncheckedIndexedAccess`), Tailwind 4, ESLint, Vitest, Playwright, GitHub Actions CI.
- Environment template `portal/.env.example` (no secrets), validated env access, deployment feature flags, a guard that refuses live Stripe keys without explicit owner approval, and an email allowlist guard for non-production.
- Sentry wiring that is inert without a DSN, with PII scrubbing on every event.
- Supabase migrations with RLS on every table:
  - `0100_foundation`: profiles, roles (admin, coach), coach assignments, append-only admin audit log.
  - `0200_commerce_entitlements`: approved products and prices (D04), product to feature mapping, orders, subscriptions, entitlement grants, Stripe event ledger, `app.has_feature` resolver with 7 day grace, dispute and refund handling, admin overrides with mandatory reason and audit log.
  - `0300_catalog_progress`: eight approved modules, lessons with publish gate (captions and transcript required; SAMPLE content blocked outside local/test), resources, lesson progress, milestones and milestone progress.
  - `0400_audit`: canonical 30 question audit v1 (imported verbatim from Phase 2), autosave drafts, immutable scored runs, path overrides, roadmap items.
- Deterministic audit engine `scoreAudit()` implementing FINAL_04 and Phase 2 rules.
- Calendar rules: group coaching, Hot Seat, workshop releases, business days with holidays, feedback cycles, Elite 24 hour rescheduling.

### Tests run
| Command | Result |
|---|---|
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm test` (unit + database authorization, PostgreSQL 16) | 87 tests pass (7 files) |
| `npm run build` | pass |
| `npm run check:copy` | pass |

### Migrations
`portal/supabase/migrations/20261101000100_foundation.sql`, `...0200_commerce_entitlements.sql`, `...0300_catalog_progress.sql`, `...0400_audit.sql`. Local only so far. Not applied to any hosted Supabase project.

### Manual verification
See `portal/README.md`: "Database tests" and "Run locally".

### Blocked or waiting on owner
- Credentials (Supabase, Stripe test, Resend, Mux, optional Sentry), domain, support email. See `portal/.env.example`.
- Items marked NEEDS OWNER in `docs/IMPLEMENTATION_ISSUES.md`.
