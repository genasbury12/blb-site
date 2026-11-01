> **SUPERSEDED IN PART (2026-11-01).** This draft was written before the finalized handoff package arrived. Where it differs, these win: `docs/handoff/FINAL_DECISIONS_REGISTER.md`, `docs/handoff/HANDOFF_SPECS.md`, `docs/phase2/PHASE2_CANONICAL_SOURCES.md`. Known differences: roles are `student`, `coach`, `admin` (D09); email vendor is Resend (D03); analytics is Vercel Analytics (D03); fonts are Cormorant Garamond and DM Sans (D01); audit has 8 categories and 30 fixed questions (Phase 2); feature keys follow HANDOFF_SPECS section 03; the app lives in `portal/`. The as-built design is tracked in `docs/BUILD_STATUS.md` and `docs/IMPLEMENTATION_ISSUES.md`.

# ARCHITECTURE.md
# The BOSS Business System: Application Architecture

_Status: DRAFT for owner review (Phase 0). Nothing here is approved until the owner signs off in DECISIONS.md._
_Prepared: October 31, 2026_

Related: [DATA_MODEL.md](DATA_MODEL.md), [ENTITLEMENTS.md](ENTITLEMENTS.md), [SECURITY.md](SECURITY.md), [BUILD_PLAN.md](BUILD_PLAN.md), [QA_MATRIX.md](QA_MATRIX.md), [DECISIONS.md](DECISIONS.md)

---

## 1. Current repository state (inspected October 31, 2026)

| Item | Finding |
|---|---|
| Repo | `genasbury12/blb-site`, branch `claude/blb-site-images-folder-5nm2vd`, clean working tree |
| Application code | None. No `package.json`, lockfile, framework, CI, env templates, or tests |
| `index.html` | 75 KB single-page static marketing page for the **existing** Boss Lady Bloggers offers ("Blog Launch Lab" 1:1 + custom Showit site; "The Blogging Ladies" $100/month membership). Built to be embedded off-repo (Showit). Uses Bricolage Grotesque + Inter and a hot pink / purple / blue palette |
| `blb site images/` | 56 brand photos plus `proof/` (6 income receipt screenshots, client names blurred) |
| `website inspo/` | 6 PNG screenshots of other sites (reference only, roughly 14 MB) |
| Live dependency | `index.html` loads images via `raw.githubusercontent.com/.../claude/blb-site-images-folder-5nm2vd/blb%20site%20images/...`. **Renaming the branch or moving that folder breaks the live embedded page.** |

Conclusion: the repo holds no existing work to reuse for the BOSS application. The BOSS app should not be scaffolded on top of `index.html`. See DECISIONS.md D-01 for where the app should live.

---

## 2. Architecture summary

One TypeScript monolith (Next.js App Router) deployed to a managed host, backed by one Supabase project per environment. Stripe is the payment system of record for money. The **application database is the system of record for access**. Access is derived only from verified webhook data and dated grants, never from browser redirects.

```
                         +-----------------------------+
 Visitors / Members ---> |  Next.js App (host: Vercel*) |
                         |  - Public marketing routes   |
                         |  - /app member portal        |
                         |  - /admin staff console      |
                         |  - Route handlers / actions  |
                         |  - Webhook endpoints         |
                         +------+------+-------+--------+
                                |      |       |
          anon/user JWT (RLS)   |      |       | server-only secrets
                                v      |       v
              +--------------------+   |   +-------------------+
              | Supabase           |   |   | Stripe (test mode |
              | - Postgres + RLS   |   |   |  until approval)  |
              | - Auth             |<--+   | Checkout, Billing,|
              | - Storage (private)|       | Customer Portal,  |
              | - pg_cron jobs     |       | signed webhooks   |
              +---------+----------+       +---------+---------+
                        |                            |
                        v                            v
         +-----------------------------+   webhook_events table
         | Job runner (scheduled fns)  |   (idempotent, replayable)
         | reminders, expiry, quotas,  |
         | email outbox, retention     |
         +------+--------------+-------+
                |              |
                v              v
   Transactional email*   Marketing email*     Video host*      Zoom (links only
   (receipts, access,     (masterclass and     (signed playback  in Phase 4; API
   reminders)             nurture, opt-in)     tokens, captions) optional later)

   * = vendor not yet approved, see section 4 and DECISIONS.md
```

### Key architectural rules

1. **Single source of access truth.** A Postgres function `app.effective_entitlements(user_id, at)` computes access. RLS policies, server code, and UI all call it. The TypeScript layer never re-implements access rules. (Details: ENTITLEMENTS.md.)
2. **Webhooks are the only path to money-derived state.** Checkout success pages show "we are confirming your payment" and poll the app's own state.
3. **No service-role key outside server-only modules.** Enforced by `server-only` imports, a lint rule, and a CI bundle scan.
4. **Every protected route checks authorization twice:** route-level guard (layout or middleware) for UX, and RLS or server-side check at the data layer for security.
5. **Configuration over code for business rules that may change:** audit questions and scoring, pricing catalog to Stripe ID mapping, schedule times, SLA durations, bonus windows. Versioned rows or versioned config files, never magic numbers inside components.
6. **Business time zone is `America/New_York`.** Store all timestamps as `timestamptz` (UTC). Compute schedules (Wednesday 1 PM ET, first and second Tuesday, first and third Monday) in the business zone so daylight saving shifts are correct.
7. **No embedded AI.** No LLM calls anywhere in the product. AI assistants are external links plus editable prompt templates.
8. **Soft delete plus retention jobs** for member-owned records. Hard deletes only through the approved data deletion workflow.

---

## 3. Proposed technology stack

| Concern | Proposal | Status | Why |
|---|---|---|---|
| Framework | Next.js (App Router, current stable), React, TypeScript `strict` | Recommended by CLAUDE.md | Server components keep secrets server-side; route handlers for webhooks |
| Styling | Tailwind CSS with design tokens as CSS variables | Recommended | Tokens map directly to the brand palette |
| UI primitives | shadcn/ui (Radix-based, copied into repo) | Recommended | Accessible focus, keyboard, dialog semantics; no runtime vendor lock |
| Validation | Zod at every trust boundary (forms, actions, webhooks, env) | Required | |
| Database | Supabase Postgres with RLS on every table | Approved | |
| Auth | Supabase Auth: email + password and magic link; optional MFA required for staff | Approved | |
| Storage | Supabase Storage, private buckets only, short-lived signed URLs | Approved | |
| Payments | Stripe Checkout, Billing (Subscription Schedules for installments), Customer Portal, signed webhooks | Approved | |
| Package manager | pnpm | Proposed | Fast, strict dependency resolution |
| Unit / integration tests | Vitest; Postgres RLS tests run against local Supabase (`supabase start`) with real JWTs per role | Proposed | RLS must be tested in the database, not mocked |
| E2E / smoke | Playwright (Chromium) + axe-core accessibility checks | Proposed | |
| Billing lifecycle tests | Stripe CLI + **Stripe test clocks** to simulate six months of installments, failures, and cures | Proposed | The only reliable way to test "stops after six" |
| PDF | `@react-pdf/renderer` server-side | Proposed | No headless browser needed on serverless hosts |
| Search | Postgres full-text search (`tsvector`) for library, lessons, community | Proposed | No extra vendor |
| Jobs | Supabase `pg_cron` triggering idempotent server endpoints, plus a `job_runs` table | Proposed | Keeps vendor count low; retries via outbox pattern |
| Rate limiting | Postgres-backed token bucket table at first; Upstash Redis if load requires | Proposed | |
| CI | GitHub Actions: lint, typecheck, unit, RLS integration, build, Playwright smoke | Proposed | Required by CLAUDE.md |

---

## 4. Vendor recommendations requiring owner approval

These are recommendations only. Pricing and capabilities must be validated by the owner before selection (blueprint section 15).

| Need | Recommendation | Alternatives | Reasoning |
|---|---|---|---|
| Hosting | **Vercel** (Pro plan when live) | Netlify, Render, Fly.io | First-party Next.js support, preview deploys per branch, simple env separation |
| Transactional email | **Postmark** | Resend, Amazon SES | Strong deliverability, separate transactional stream, good bounce/complaint webhooks |
| Marketing email | **Owner's current platform**. Flodesk appears to be connected to your Claude account; if Flodesk is your list today, keep it and sync opt-ins via its API | Kit (ConvertKit), MailerLite | Avoids migrating your list; the app only pushes consented subscribers and tags/segments |
| Video hosting | **Mux** (signed playback, auto captions, per-asset analytics) | Vimeo (Pro/Business, domain privacy), Bunny Stream (lowest cost) | Signed, expiring playback tokens map cleanly to entitlement checks; captions support accessibility |
| Lesson recording | Your choice. Tella is also connected to your Claude account and can export finished files for upload to the video host | Loom, ScreenFlow, Descript | Recording tool is separate from hosting |
| Zoom | **Phase 4: store approved join links per session (no API).** Optional later: Zoom API for auto-importing cloud recordings | Zoom API from day one | Manual links ship sooner and avoid storing Zoom OAuth secrets |
| Error monitoring | **Sentry** | Highlight, Better Stack | Source maps, release tracking, PII scrubbing |
| Product analytics | **Plausible** (cookieless) for public pages; first-party `analytics_events` table for funnel events | PostHog | Cookieless analytics reduces consent banner burden; confirm with counsel |
| Uptime / logs | Better Stack or Vercel built-ins | | |
| Backups | Supabase Pro daily backups + Point-in-Time Recovery add-on; quarterly restore drill | | Required by blueprint launch gate |
| Tax | Stripe Tax (decision needed) | Manual | See DECISIONS.md |

---

## 5. Domain and hosting topology (decision needed)

The current Boss Lady Bloggers site is on **Showit** (about.md: "The current brand guide specifies Showit as the site platform"). CLAUDE.md requires the BOSS public pages (`/`, `/program`, `/pricing`, `/masterclass`, `/apply/elite`) inside the application.

Recommended topology (pending D-02):

- Main brand site and blog stay on Showit at the existing domain.
- BOSS application on a dedicated subdomain chosen by the owner (not invented here), hosting its own `/`, `/program`, `/pricing`, `/masterclass`, `/apply/elite`, `/app`, `/admin`.
- Showit pages and blog posts link to the BOSS subdomain for the funnel.

Environments: `local` (Supabase CLI), `staging` (separate Supabase project + Stripe test mode + email sandbox), `production` (separate Supabase project; Stripe live only after explicit approval).

---

## 6. Route tree

Legend: **Access** column uses entitlement keys from ENTITLEMENTS.md. `auth` = any signed-in user. Staff roles: `coach`, `support_admin`, `super_admin`.

```
/                                   public   Marketing home
/program                            public   Program sales page: phases, 8 modules, tiers, FAQs, policies
/pricing                            public   Three tiers, PIF vs 6 installments with transparent totals
/masterclass                        public   Registration (consent, attribution capture)
/masterclass/watch                  token|auth  Registration token (signed, expiring) or session
/apply/elite                        public   Elite application form (rate-limited, bot protection)
/apply/elite/confirmation           public
/checkout/[offer]                   public|auth  Server creates Stripe Checkout session (Elite requires approved application)
/checkout/return                    public   "Confirming your payment", polls app state, never grants access
/login  /signup  /forgot-password  /reset-password  /auth/callback
/privacy  /terms  /refund-policy  /contact   public (legal copy requires owner and counsel approval)
/blog/* (optional)                  public   Only if not served by Showit

/app                                auth + any member entitlement   Dashboard: path, next 3 actions, coaching eligibility, progress
/app/start                          curriculum_access   Welcome video, Getting Started Guide, onboarding checklist
/app/audit                          curriculum_access   Audit: start, resume draft
/app/audit/[reportId]               owner only           Report, history comparison, PDF download
/app/learn                          curriculum_access   8 modules by BOSS phase, path ordering toggle
/app/learn/[module]/[lesson]        curriculum_access   Video, transcript, resources, assignment, mark complete
/app/library                        curriculum_access   Implementation Library search and filters
/app/library/[item]                 curriculum_access
/app/ai-tools                       curriculum_access   External ChatGPT/Claude links, editable prompt templates
/app/progress                       curriculum_access   Milestones, optional evidence uploads, 6-month roadmap
/app/workshops                      coaching_access     Workshop library
/app/workshops/[id]                 coaching_access
/app/coaching                       coaching_access     Calendar, join links, advance questions, replays
/app/coaching/hot-seat              coaching_access     Apply, edit, withdraw, consent
/app/coaching/replays/[id]          coaching_access
/app/community                      community_access    Feed, search, tags, pinned
/app/community/[postId]             community_access    Threaded replies, reactions
/app/feedback                       feedback_access     Quota, submit, status, responses
/app/feedback/[id]                  owner + staff
/app/elite                          board_access        Board overview (own board only)
/app/elite/tasks/[id]               board_access
/app/elite/check-ins                elite_coaching      Weekly 4-question check-in
/app/elite/audit                    board_access        Coach-led audit dashboard + PDF
/app/elite/roadmap                  board_access
/app/elite/requests                 dfy_request_access  Implementation requests, hours ledger
/app/elite/export                   board owner         Export request (also during 30-day post-cancel window)
/app/billing                        auth                Products, statuses, invoices, Stripe Customer Portal handoff
/app/settings                       auth                Profile, accessibility prefs, notification prefs, data requests
/app/support                        auth                Help, refund request form (email fallback shown)

/admin                              staff               Operational overview
/admin/content/...                  coach|super_admin   Modules, lessons, resources, library, workshops, releases
/admin/members/...                  support_admin|super_admin  Status, grants, audit summary (permission-gated)
/admin/coaching/...                 coach|super_admin   Sessions, Hot Seat selection, replays, consents
/admin/feedback                     coach|super_admin   Queue, SLA due dates, monthly quotas
/admin/elite/...                    coach|super_admin   Applications, discovery, approval, seats, boards, audits, hours, packages
/admin/community                    coach|support_admin|super_admin  Reports, moderation, pins
/admin/billing                      support_admin|super_admin  Read-only Stripe state; refund workflow (execute: super_admin)
/admin/refunds                      support_admin|super_admin  Review queue (3 business day SLA)
/admin/operations                   super_admin         Webhook failures and replay, job runs, export/deletion requests, audit logs

/api/webhooks/stripe                Stripe signature only
/api/webhooks/email                 provider signature only (bounces, complaints)
/api/jobs/[job]                     cron secret only (scheduled jobs)
/api/files/sign                     auth + per-object authorization (returns short-lived signed URL)
/api/video/token                    auth + entitlement (returns short-lived playback token)
```

Navigation is generated from the same entitlement result so members never see links to areas they cannot use, but hidden links are never the security boundary.

---

## 7. Source layout (proposed)

```
app/                    Next.js routes: (marketing), (auth), app/, admin/, api/
components/ui/          shadcn primitives (tokenized)
components/             Reusable product components (cards, progress, video player, empty states)
lib/server/             server-only: supabase admin client, stripe, email, entitlements wrapper, audit log
lib/domain/             pure business logic with unit tests (schedules, business days, quotas, scoring)
lib/validation/         Zod schemas shared by forms and actions
config/                 catalog.ts (offer to Stripe price ID by env), audit/v1.json, schedule.ts, sla.ts
supabase/migrations/    SQL migrations (RLS in same migration as table)
supabase/tests/         RLS and function tests
supabase/seed/          clearly labeled fixtures (TEST DATA ONLY)
tests/e2e/              Playwright
docs/                   This documentation set
```

---

## 8. Background jobs

| Job | Schedule (ET) | Idempotency key |
|---|---|---|
| Entitlement expiry sweep and notices | hourly | `grant_id + transition` |
| Installment grace monitor (day 0, 3, 6 reminders; day 7 suspend) | hourly | `obligation_id + day` |
| Feedback allowance cycle rollover | hourly (per member cycle boundary) | `user_id + cycle_start` |
| Group coaching reminders (24h, 1h) | hourly | `session_id + user_id + kind` |
| Hot Seat close (first Tuesday 1 PM), selection notices deadline alert | per schedule | `month + kind` |
| Elite check-in reminders and due flags | hourly | `checkin_id + kind` |
| Workshop release publish (first and third Monday) | daily | `release_id` |
| Email outbox sender with retry and backoff | every minute | `email_event_id` |
| Webhook retry for failed processing | every 5 minutes | Stripe `event.id` |
| Retention: board export window, 90-day inactive purge, soft-delete purge | daily | `subject_id + policy_version` |
| Stripe reconciliation (compare app ledger to Stripe) | daily | date |

---

## 9. Observability and operations

- Structured logs with request IDs; no PII in logs (emails hashed).
- Sentry for errors with PII scrubbing.
- `/admin/operations`: failed webhooks with one-click replay, job run history, outbox failures.
- Incident runbook, backup restore drill, and key rotation procedure documented before launch (SECURITY.md section 9).
