# Feature checklist

Updated 2026-11-02.

**Legend**
- **Tested**: built and covered by automated tests in this repository (unit, database authorization, or browser).
- **Built, verify live**: built and tested with mocks or fixtures. It still needs the external account connected and a live check on staging.
- **Owner input**: needs your content, approval, or decision.
- **Deferred**: intentionally not built, with the reason given.

Nothing has been verified against real Supabase, Stripe, Mux, or Resend accounts yet. The signed in browser journeys are written and run once a staging project exists (see `OWNER_SETUP.md`).

## Accounts and security
| Feature | Status |
|---|---|
| Sign up with email confirmation, sign in, password reset, sign out | Built, verify live (forms, validation, and route protection tested; auth server needs Supabase) |
| Roles: student, coach (assigned members only), admin (script only, no self promotion) | Tested |
| Row level security on every table; cross student isolation | Tested (87 database tests) |
| Signed out visitors kept out of `/app` and `/admin`; admin returns 404 to non staff | Tested |
| Open redirect protection, generic login errors, security headers | Tested |
| Private files through 5 minute signed links after an authorization check; type, size, and content checks | Tested (logic); Built, verify live (Supabase Storage) |
| Audit log of admin, content, entitlement, price, role, hours, and coaching changes | Tested |
| Sentry error reporting with PII scrubbing | Built, verify live (needs a DSN) |
| Malware scanning of uploads | Deferred until a scanning service is chosen (I-31) |

## Learning
| Feature | Status |
|---|---|
| Eight approved modules, all open, published only content, SAMPLE content blocked outside staging | Tested |
| Lesson page: video, captions required to publish, transcript, objective, assignment, downloads, AI prompt with external assistant link, path callouts, mark complete, next lesson | Tested (rules); Built, verify live (Mux video) |
| Learning completion and business milestones tracked separately | Tested |
| Implementation Library with search and filters | Tested |
| Real lessons, videos, captions, worksheets, workshop recordings | **Owner input**: content production |

## Business audit and roadmap
| Feature | Status |
|---|---|
| Canonical 30 questions (Phase 2 wording), eight sections, autosave each answer, back and resume | Tested |
| Deterministic scoring, both paths, top three priorities, strengths, Module 1 question mapping, category fallback | Tested (40 plus scoring tests) |
| Immutable runs, retakes keep earlier reports, lessons, and roadmap progress | Tested |
| Path override with history, six month roadmap with done toggles | Tested |
| Web report and downloadable PDF report | Tested |

## Billing (Stripe test mode)
| Feature | Status |
|---|---|
| Plans page with approved prices and six payment totals | Tested |
| Checkout: Blueprint and Accelerator (pay in full or six payments), Elite after acceptance, Graduate and Board with billing deferred until coaching ends | Built, verify live |
| Signed webhooks, duplicates, retries, out of order delivery, live mode refused without approval | Tested |
| Six payments then automatic stop; seventh charge flagged | Tested (ledger); Built, verify live (test clock run) |
| Seven day grace, cure without date reset, dispute suspends, refund revokes, partial refund to review | Tested |
| Customer portal for payment methods; cancel or resume memberships at period end | Built, verify live |
| Admin price ID mapping, exception review, orders, webhook log | Built, verify live |
| Live payments | **Owner input**: only after launch approval |
| Extra DFY hour packages sold through checkout | Deferred (I-30): packages are recorded by an admin until you confirm they are part of the launch catalog |

## Coaching and community
| Feature | Status |
|---|---|
| Coaching Hub: sessions, private join links, advance questions, replays only while coaching is active | Tested |
| Session scheduling from the calendar rules (Wednesdays 1 PM Eastern, Hot Seat second Tuesday), holiday skips, cancellations | Tested |
| Workshop library: first and third Monday releases, published only | Tested |
| Hot Seat applications: consent, first Tuesday close, edit or withdraw, selection, carry forward | Tested |
| Feedback: two per monthly cycle, no rollover, three business day target, files and links, coach responses | Tested |
| Community: posts, threaded replies, reports, moderation, pinned announcements, rate limits, first names only | Tested |
| Email notifications (feedback ready, Hot Seat decision, Elite decision) | Built, verify live (suppressed until Resend is connected and sending is approved) |
| Community likes and image attachments | Deferred (D10 specifies simple threaded posts) |

## Elite
| Feature | Status |
|---|---|
| Public application, staff pipeline, discovery call, acceptance holding a seat for 14 days | Tested |
| Five seat cap including held offers | Tested |
| Checkout only for the accepted applicant; payment provisions the workspace and 12 hours | Tested |
| Private workspace: roadmap, tasks, deliverables, coach led audit, files, requests, hours | Tested |
| Weekly sessions, 24 hour rescheduling rule, coach cancellation with replacement | Tested |
| Weekly four question check-in due 24 hours before, late flag | Tested |
| Minute ledger: recorded after the work, never above the allowance, append only, admin void | Tested |
| Hours only mode during the 30 day extension (I-11) | Tested |
| Coach notes never visible to clients; client A never sees client B | Tested |
| Missed check-in consequences | **Owner input**: service agreement (I-40) |

## Admin workspace
| Feature | Status |
|---|---|
| Overview with connected service status | Built |
| Students and access: search, purchases, audits, progress, grant, suspend, or revoke with reason, coach role and assignments | Tested (database functions); Built, verify live (directory needs the Supabase server key) |
| Curriculum: modules, lessons, status workflow, milestones, downloads, coach suggestions | Tested |
| Library, workshops, coaching, Hot Seat, feedback queue, moderation, holidays | Built |
| Payments and exceptions | Built |
| Elite clients and per client management | Built |
| Audit log | Built |

## Public pages
| Feature | Status |
|---|---|
| Portal home, sign in, sign up, password pages | Tested |
| Refund policy, terms, privacy | Built as drafts marked "pending legal review" (**Owner input**: legal approval) |
| Sales pages `/program`, `/pricing`, `/masterclass` funnel | Deferred until sales copy and the masterclass video exist and are approved (Slice 7, `FEATURE_MARKETING_PAGES`) |
| Your existing Showit site and `index.html` | Untouched by instruction (`FUTURE_MARKETING_CLEANUP.md`) |
