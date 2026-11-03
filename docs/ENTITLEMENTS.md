> **SUPERSEDED IN PART (2026-11-01).** This draft was written before the finalized handoff package arrived. Where it differs, these win: `docs/handoff/FINAL_DECISIONS_REGISTER.md`, `docs/handoff/HANDOFF_SPECS.md`, `docs/phase2/PHASE2_CANONICAL_SOURCES.md`. Known differences: roles are `student`, `coach`, `admin` (D09); email vendor is Resend (D03); analytics is Vercel Analytics (D03); fonts are Cormorant Garamond and DM Sans (D01); audit has 8 categories and 30 fixed questions (Phase 2); feature keys follow HANDOFF_SPECS section 03; the app lives in `portal/`. The as-built design is tracked in `docs/BUILD_STATUS.md` and `docs/IMPLEMENTATION_ISSUES.md`.

# ENTITLEMENTS.md
# Identity, Roles, Entitlements, and Access Resolution

_Status: DRAFT for owner review. Rules here are transcribed from the blueprint and CLAUDE.md. Items marked **[D-xx]** depend on an open decision in DECISIONS.md and are not to be implemented by guessing._

---

## 1. Separate concepts (never one `tier` string)

| Concept | Stored in | Example |
|---|---|---|
| Identity | `auth.users`, `profiles` | A person with an email |
| Staff role | `staff_roles` | coach, support_admin, super_admin |
| Purchase | `purchases` | "Accelerator, 6 installments, enrolled 2027-02-03" |
| Payment obligation | `payment_obligations`, `installments` | 6 x $297, 4 paid, 1 past due |
| Subscription | `subscriptions` | Graduate coaching, current period ends 2027-09-03 |
| Dated grant | `entitlement_grants` | `accelerator_coaching` from T0 to T0 + 6 months, source purchase X |
| Suspension or revocation | `grant_status_events` | suspended at day 8 of past due, restored on cure |
| Elite board | `elite_boards`, `elite_board_members` | Board for client Y, state active, export window, retained |

Roles: `guest` (anonymous, not stored), `member` (any authenticated non-staff user), `coach`, `support_admin`, `super_admin`. A staff member can also be a member. Staff role never implies a business entitlement and vice versa.

---

## 2. Stored business entitlement grants

| Grant key | Created by | Window | Notes |
|---|---|---|---|
| `blueprint_core` | Any tier purchase (Blueprint, Accelerator, Elite) | enrollment to enrollment + 12 months | Core curriculum, templates, AI resources, Implementation Library |
| `accelerator_coaching` | Accelerator purchase | enrollment to enrollment + 6 months **[D-05 start date]** | Group coaching, community, workshops, Hot Seat, replays, 2 feedback per cycle |
| `elite_coaching` | Elite purchase after approval | enrollment to enrollment + 6 months **[D-05]** | Everything in Accelerator plus weekly private 60 min, coach-led audit, board |
| `dfy_included_hours` | Elite purchase | enrollment to coaching end + 30 days | 12 hours, ledger in `hour_ledger` |
| `dfy_package` | Extra hours package purchase (Elite only **[D-14]**) | purchase to purchase + 3 months | 3 / 5 / 10 hours, separate ledger bucket |
| `graduate_coaching` | Graduate subscription | current paid period; ends at period end after cancellation | Coaching, community, workshops, Hot Seat, replays. **No feedback, no 1:1, no DFY.** Extends curriculum while active |
| `elite_board` | Board retention subscription | current paid period | Board (Claude board link and portal workspace), training (new lessons) and workshops. No 1:1 or group coaching, community, feedback or DFY. **Changed by owner decision 2026-11-03 (I-55); previously board only, never extending curriculum** |
| `launch_kit` | Eligible purchase during a published bonus window | **[D-11 duration]** | Five Launch Kit assets |

All windows are half-open intervals `[starts_at, ends_at)` stored as `timestamptz`. "12 months" means `starts_at + interval '12 months'` in `America/New_York` calendar terms **[D-16 confirm exact-instant vs end-of-day]**.

---

## 3. Derived capabilities (what the app actually checks)

Computed by `app.effective_entitlements(user_id, at timestamptz)` in Postgres. A grant counts only if: `starts_at <= at < ends_at`, not revoked, and not suspended.

| Capability | Formula | Unlocks |
|---|---|---|
| `curriculum_access` | `blueprint_core` OR `graduate_coaching` | /app/start, audit, learn, library, ai-tools, progress |
| `coaching_access` | `accelerator_coaching` OR `elite_coaching` OR `graduate_coaching` | Group coaching calendar and links, replays (incl. historical Hot Seat), workshops, Hot Seat applications |
| `community_access` | same as `coaching_access` | Community feed, posting, notifications |
| `feedback_access` | `accelerator_coaching` OR `elite_coaching` | 2 submissions per monthly cycle **[D-06 cycle definition]** |
| `elite_private` | `elite_coaching` | Private session schedule, weekly check-ins |
| `board_access` | `elite_coaching` OR `elite_board` OR (`dfy_included_hours` active **[D-04]**) | /app/elite board, files, roadmap, audit |
| `dfy_request_access` | (`dfy_included_hours` active AND remaining > 0) OR (any `dfy_package` active AND remaining > 0) | Submit implementation requests |
| `launch_kit_access` | `launch_kit` | Launch Kit resources |
| `board_export_window` | board ended within last 30 days | Request export only |

---

## 4. Entitlement matrix by persona

Y = yes, N = no, R = read-only, "-" = not applicable. Times are relative to enrollment date T0.

| Capability | Anonymous | Blueprint | Accelerator 0 to 6 mo | Accelerator 6 to 12 mo | Elite 0 to 6 mo | Elite 6 mo to 6 mo + 30 d | Elite 6 to 12 mo | Any tier after 12 mo | Graduate (active) | Board-only (active) | Suspended (past due > 7 d) | Refund initiated |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Public pages, masterclass | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Core curriculum, library, AI tools, audit | N | Y | Y | Y | Y | Y | Y | N | Y | N (unless also in 12 mo window) | N | N |
| Own audit history and PDF | N | Y | Y | Y | Y | Y | Y | **[D-15]** | Y | **[D-15]** | **[D-15]** | Customer-owned records retrievable via request |
| Group coaching, replays, Hot Seat | N | N | Y | N | Y | N | N | N | Y | N | N | N |
| Workshops | N | N | Y | N | Y | N | N | N | Y | N | N | N |
| Community | N | N | Y | N | Y | N | N | N | Y | N | N | N |
| Feedback submissions (2 per cycle) | N | N | Y | N | Y | N | N | N | **N** | N | N | N |
| Private weekly 1:1 + check-ins | N | N | N | N | Y | N | N | N | N | N | N | N |
| Elite board | N | N | N | N | Y | **[D-04]** | N (unless board sub) | N | N | Y | N | N |
| DFY requests (included 12 h) | N | N | N | N | Y | Y (remaining hours) | N | N | N | N | N | N |
| DFY extra package hours | N | N | N | N | Y (3 mo from purchase) | Y (3 mo from purchase) | **[D-14]** | **[D-14]** | N | **[D-14]** | N | N |
| Launch Kit | N | if eligible | if eligible | if eligible | if eligible | if eligible | if eligible | **[D-11]** | - | - | N | N (revoked with purchase) |
| Billing page, settings, support, refund form | N | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |

Notes:
- Graduate membership extends curriculum only while active. On cancellation, access continues to the end of the paid period, then curriculum ends if the 12-month window has also passed.
- Board-only subscription never extends curriculum, coaching, or DFY.
- Graduate + board together ($194/month) is simply both grants.
- Eligibility to purchase graduate or board subscriptions: **[D-07]**.

### Staff permissions

| Area | coach | support_admin | super_admin |
|---|---|---|---|
| Content CMS (modules, lessons, library, workshops) | edit + publish | read | all |
| Members: status, grants | read | read + manual grant with reason | all |
| Member audit report details | Elite clients and feedback context only **[D-17]** | summary only **[D-17]** | all |
| Coaching sessions, Hot Seat selection, consents | all | read | all |
| Feedback queue and responses | all | read | all |
| Elite applications, approval, seats | all | read | all |
| Elite boards | assigned boards **[D-17]** | none by default | all (logged) |
| Hours ledger entries | create own entries | read | all |
| Community moderation | all | all | all |
| Billing state | none | read | read |
| Refund review | none | review + recommend | approve + execute |
| Role changes, operations, exports, webhook replay | none | none | all |

Every staff read of a member's private data (audit, board, feedback, files) writes `access_audit_logs`. Every staff write writes `admin_audit_logs`.

---

## 5. State machines

### 5.1 Purchase

```
checkout_created --(webhook: checkout.session.completed + payment/first invoice paid)--> active
active --(refund requested)--> refund_requested --(approved + Stripe refund initiated)--> refunded (grants revoked at initiation)
refund_requested --(denied)--> active
active --(all obligations complete)--> paid_in_full (grants keep their own dates)
```

### 5.2 Installment obligation (six-payment plan)

```
                 +--------------------- cure (invoice paid) --------------------+
                 v                                                              |
pending_first -> current --invoice payment_failed--> past_due_grace (days 0-7) -+
                   |                                      | day 7 elapsed, unpaid
                   |                                      v
                   |                                  suspended --cure--> current
                   | 6th successful installment
                   v
               completed (Stripe schedule ends, subscription canceled; no 7th charge)

Any state --refund initiated--> refunded (remaining installments canceled)
Any state --admin write-off (super_admin, logged)--> written_off   [D-12]
```

Rules:
- Grace clock starts at the **first failed attempt** of an installment invoice. Access continues during grace.
- After 7 full days unpaid, all grants sourced from that purchase move to `suspended`. Suspension never shortens or extends `ends_at`.
- Cure restores grants **with original dates** (no reset, no extension for time spent suspended) per CLAUDE.md.
- `completed` is determined by **the app's count of successfully paid installment invoices = 6**, cross-checked against Stripe. The Stripe schedule ends billing after six billing periods; if an invoice is still unpaid at that point the obligation remains open as a receivable and is handled per **[D-12]**.
- Stripe dunning settings must be "leave subscription past due" (not cancel) so the schedule is not destroyed by a failure.

### 5.3 Subscriptions (graduate, board)

```
active --cancel requested--> active_cancel_at_period_end --period end--> ended
active --payment failed--> past_due [D-13: same 7-day grace?] --> ended or cured
```

### 5.4 Elite application and seat

```
submitted -> under_review -> discovery_scheduled -> discovery_completed
   -> approved (seat RESERVED until approval_expires_at) -> enrolled (seat ACTIVE)
   -> declined | withdrawn | approval_expired (seat released)
```

- Checkout for Elite is created **only server-side**, only for the authenticated user named on an `approved`, unexpired application, and only if `active_seats + reserved_seats <= 5`. The Stripe Checkout session carries `application_id` in metadata and the webhook re-verifies before granting.
- If a webhook ever arrives for an Elite payment without a valid approved application (bypass attempt, race), the app grants nothing, flags `/admin/operations`, and alerts super_admin for refund.
- "Active Elite client" for the cap of 5: **[D-03]** (recommend: from enrollment until `dfy_included_hours` window ends).

### 5.5 Elite board lifecycle

```
provisioned (on Elite enrollment) -> active (elite_coaching)
  -> [D-04 30-day hours window]
  -> retained_by_subscription (elite_board active) -> ...
  -> ended -> export_window (30 days, member may request export)
  -> inactive_retention (until day 90 after end, reactivation possible)
  -> purged (retention job, logged)    [policy version must be approved, D-18]
```

### 5.6 Feedback allowance

- Each `feedback_access` member has a `feedback_allowances` row per cycle: `cycle_start`, `cycle_end`, `granted = 2`, `used`.
- Submission decrements atomically; database constraint `used <= granted`.
- No rollover: a new cycle row always starts with 2 regardless of the previous cycle.
- Cycle definition **[D-06]** (recommend: monthly from coaching start date, which aligns with the six cycles of a six-month term).

### 5.7 DFY hours ledger

- `hour_buckets`: one `included` bucket (12.00 h, expires coaching end + 30 days) and one bucket per package (3, 5, 10 h, expires purchase + 3 months).
- `implementation_time_entries` are recorded **after work**, by the coach, against a request and a bucket.
- Constraint: sum of entries per bucket `<= bucket.hours`. An entry that would exceed is rejected; the coach must split across buckets or the client must buy a package. No automatic overage billing.
- Bucket consumption order **[D-14]** (recommend: earliest expiring first).
- Expired buckets are read-only; remaining hours show as expired, not deleted.

---

## 6. Resolver implementation notes

- `app.effective_entitlements(uid, at)` returns a set of capability keys plus metadata (ends_at, reason). `STABLE`, `SECURITY DEFINER` with fixed `search_path`, readable only for `auth.uid()` or staff.
- `app.has_capability(key)` wraps it for RLS policies using `now()`.
- Tests call the function with fixed `at` values at boundaries: T0 - 1s, T0, T0 + 6 months - 1s, T0 + 6 months, T0 + 12 months - 1s, T0 + 12 months, DST transition dates (March and November), and leap day enrollment (Feb 29 + 12 months).
- The UI receives the resolved set once per request (server component) and never computes access itself.
