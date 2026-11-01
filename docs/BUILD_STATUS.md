# BUILD_STATUS.md

Status of The BOSS Business System portal build. Updated at every milestone (contract step 3).
**Nothing is deployed. Nothing is live.** No real credentials, payments, or emails have been used.

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
