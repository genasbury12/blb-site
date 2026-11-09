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
| 8 Internal QA and release | Staging Supabase migrated, six test accounts provisioned, signed in permission and browser checks passing (2026-11-02); auth settings, Vercel and Stripe test mode pending; owner sign off pending |

## Elite from a sales call, and programs granted by hand (2026-11-09)

- **Accept from a sales call** (Admin, Elite; admins only): her name, her email and an optional note. She is accepted at once with no application: Elite checkout opens for that email for 14 days and holds one of the five seats, exactly like an accepted application. An open application from the same email is accepted instead of adding another. "Email her the sign up link now" is off by default; with it off, the page shows the link to send yourself. Refused when she is already accepted, already has Elite, or all five seats are taken. Logged as `elite_applications.accept_from_call`.
- **Grant a program** (Students & access, a member's page; admins only): Blueprint, Accelerator or Elite with a reason. Every feature the program includes, dated as a purchase would be (12 months of course, 6 months of coaching, Elite hours 6 months and 30 days), as admin overrides, each logged, plus one `entitlement.grant_program` entry. For when payment is collected outside the portal (I-105).
- Elite granted by hand now gets what a purchase gets: her private workspace, the 12 included hours, and her accepted application marked enrolled (I-106).
- Migration 2700 (applied to staging). The admin grant forms on the member page no longer squeeze the Reason box when a message shows.
- Tests: database 154 (new `elite-sales-call.test.ts`, in rolled back transactions so the seat counts of other tests hold); staging `elite-sales-call.spec.ts` (new fixture suite `elitecall`), 4 of 4 on desktop and mobile: Apply for Elite before, accepted with nothing emailed, a second accept refused, Pay $4,997 and Six payments of $897 offered instead of the application, Elite granted by hand, her workspace open with 12 hours. Cleanup removes the test client, her workspace and application.

## Admin: manage worksheets and lessons without code (2026-11-06)

- **Worksheet picker** on the lesson edit page: every worksheet with the lesson it is on. Choosing one from another lesson warns "This will remove it from ..." before saving; None detaches. One worksheet per lesson (now a database rule, migration 2500).
- **Attached to lesson** on the worksheet page, grouped by module, with real lesson titles ("Module 1, Lesson 1: Your Blog Is Not Your Business") here and in the worksheet list.
- **New worksheet** (Worksheets): title, slug, lesson, draft. Questions are a schema file (JSON); paste one when creating or later on a draft ("Load questions"). A worksheet without questions cannot be published.
- **Reorder**: up and down arrows on Curriculum swap neighbours in one transaction (the position rule is checked at the end, so a swap never hits it).
- **Delete** next to Archive: counts of member progress and worksheet answers, a CSV link, the typed title when a real lesson has member data. The worksheet is detached and kept. **Delete all sample lessons** on Curriculum lists the worksheets it detached.
- Positions run 1 to 999; publish rules no longer block position edits (I-100, I-101).
- Worked examples shown to members under "See an example"; Lesson 4 copy-forward saved on first edit (owner decisions, I-89, I-92).
- Staging, done through the admin: "Lesson 1: Starting Point" attached to "Your Blog Is Not Your Business"; all 23 sample lessons deleted (eight Module 1 worksheets detached and kept); Module 1 holds only the two real lessons, at 1 and 2.
- Tests: database 149 (new `worksheet-attach.test.ts`); unit 273; staging `admin-lesson-form.spec.ts` 10 of 10 on desktop and mobile. The staging suites now make their own temporary lessons, since staging keeps only real lessons.

## Admin lesson forms: specific duplicate errors, values kept on a failed save (2026-11-06)

- A save that hits a unique constraint names the lesson already there: "Position 1 in this module is taken by "SAMPLE: Module 2 lesson 1". Choose another position, or move that lesson first." or "That slug is already used by "..." in this module." The constraint is read from the database error (`lessons_module_id_order_index_key`, `lessons_module_id_slug_key`), then the other lesson is looked up. Any other duplicate still gets the general message.
- A failed save (a form check or a database refusal) sends the submitted values back, and the shared admin form fills them in again after React's automatic form reset. Hidden and file inputs are left alone; unchecked boxes stay unchecked.
- Tests: unit `form-result.test.ts`; staging `admin-lesson-form.spec.ts` (new suite `catalog` in the fixture script), 3 of 3 on desktop and on mobile: a new lesson into a taken position, an edit onto a used slug and then a taken position, and a form check failure; every field, the Mux ID and a 120 line transcript included, is still filled in each time. Run against the previous form component, the same test fails with the title emptied.

## Module 1 worksheets, Lessons 4 to 9 (brief 18, 2026-11-05)

Briefs: `docs/18_MODULE1_WORKSHEETS_ALL.md` and dev notes `docs/12_` to `docs/17_`. Schemas: `docs/worksheet_m1-l4` to `l9` (copied to `portal/src/domain/worksheets/fixtures/`).

**Seeded on staging, all as drafts with their milestones as drafts:** Lessons 4 to 8 on sample lessons 4 to 8 (staging had no Lesson 8, so the seed added `SAMPLE: Module 1 lesson 8`, like Lesson 9 before it). Lesson 9 replaced the Slice E placeholder in place (same slug, version 1; it had no answers) and went from published to draft, as brief 17 asks.

**Lesson 1 keys (owner decision 2026-11-05: map, don't rename).** Briefs name them `q1_treating_as_business`, `q2_pay_for`, `q3_blog_disappeared`, `realization`; the seeded Lesson 1 uses `q1`, `q2`, `q3`, `realization`. `SOURCE_KEY_ALIASES` in `src/domain/worksheets/callbacks.ts` maps the first three; nothing in Lesson 1 changed.

**Built once, reused across the set:**
- Named option lists: any top level `*_options` list works with `options_from` (confidence, format, decision, stage, exists, tested, verdict, evidence). Inline options can be plain values or value/label/guide objects.
- `multichoice` with inline options (Lesson 8): stored as values, shown as labels joined with ", ".
- Callbacks: `{value}` (or the field's own name) quotes the whole answer; sentence slots fill by name; no template means the whole answer. A callback with an empty heading joins the box above it (Lesson 4's three problems), and an empty `missing_text` shows nothing.
- Lesson 4: `prefill_from` copies Lesson 3 problems into `problem_{k}`; the five questions x three problems scorecard is one grid on desktop and stacks by problem on mobile (one set of inputs, reordered with CSS; only groups with a fallback label such as "Problem {k}", so Lesson 2 keeps its reviewed layout); `note_placeholder`; `count_value` tiles count members with any Weak.
- Lessons 5 to 8: optional fields shown muted with an "Optional" tag; card rows print each field's guide once above the rows; ratings without their own list use Strong, Uncertain, Weak.
- Lesson 9: `callback_layout` decision cards (quote on top, the decision's verdict, evidence and note beneath, unnumbered quotes inside the card before them); `callbacks_inline` quotes four Lesson 1 answers in section 4; `optional: true` section 2 starts closed behind Show; the `pdf` block puts `business_sentence` on the PDF cover, prints each decision with its quote, and keeps "Download all Module 1 worksheets"; tallies over `dec_{n}` and `ev_{n}`.
- PDF: a repeat field labelled per key prints that label; an empty optional section is left out.

**Tests:**
- Unit: 268 passed. New `module1.test.ts` checks every schema parses, brief 18's key contract, every callback and prefill points at a real field (through the Lesson 1 mapping), every worked example is valid and complete, and every quote resolves. Every lesson's PDF renders from its worked example.
- Staging: `worksheets-module1.spec.ts`. A new member does the audit and Lesson 1, then Lessons 2 to 9 in order with each worked example (Lesson 2 has none, so the test writes one), checking every quote before filling each lesson, the Lesson 4 prefill and grid, Lesson 9's decision cards and closed optional section, each milestone, the Lesson 9 PDF and the 38 page Module 1 bundle, then the admin tiles and CSV.
- The older journey suite (`worksheets.spec.ts`) now uses Module 2 sample lessons 1 and 2, since every Module 1 lesson has its own worksheet.

## Lesson 3 worksheet: Customer Research Workbook (2026-11-05)

Brief: `docs/11_LESSON3_WORKSHEET.md`. Schema: `docs/worksheet_m1-l3-customer-research.json` (copied to `portal/src/domain/worksheets/fixtures/`).

- Seeded on staging as a **draft** on Module 1 Lesson 3 (sample-lesson-3), with the milestone "I built a buyer snapshot from real evidence" as a draft. Publish both from Admin when ready.
- **Variable length rows.** `repeat_groups` take `label`, `min_visible` and `add_label`. A group with a label renders one card per row (Observation 1 to 8); five show first, "Add another observation" reveals the next and moves focus into it; rows that already have answers always show. The PDF prints only observation rows with content.
- **Supported by observations.** New field type `multichoice` with `options_from_repeat`. Offers the evidence rows with content, labelled with the first 60 characters of what she said; stored as a list of row numbers in row order; admin table and CSV show "1, 2".
- **Where you started.** Top level `callbacks[]` quote the Lesson 2 hypothesis before section 1, in the same quote box as the Lesson 9 placeholder. Until Lesson 2 is complete it shows `missing_text`; the member can still work. Shared resolver in `src/domain/worksheets/callbacks.ts`, used by the lesson page, the PDF and the data export.
- **Confidence.** `confidence_options` is a choice list: three small chips, guide on hover and the chosen one's guide beneath.
- **Admin tiles.** `admin_counts`: observations logged (total, and the per member range) and the confidence tally "hypothesis / observed / confirmed".
- `callbacks_provided` keys are kept and tested; `footer_note` prints muted at the end of the PDF.
- PDF: section and subsection headings now stay with their first answer instead of ending a page (Lesson 2 benefited too).

Tests: unit 226 passed (new `lesson3.test.ts`, PDF and fixture tests); lint, typecheck and copy rules clean; staging `worksheets-module1.spec.ts` 7 of 7 on desktop and 7 of 7 on mobile, each with a fresh member, then cleaned up (statuses restored, member removed, test admin disabled).

## Data rights, Slice D: coach and admin data boundaries (2026-11-05)

- **Coaches never see a member's email.** The one remaining place was Elite applications (the page showed applicant emails to coaches, and the table policy allowed all staff). Migration `20261104002300_coaches_never_see_emails.sql`: admins read the table; coaches read through `coach_elite_applications()`, which leaves the email out; the page shows emails to admins only. Already true elsewhere: Students & access (coaches see names only), member pages, worksheets, feedback, coaching, community. Coaches still cannot export (ZIP or CSV), read orders, see deletion requests, open Data settings, or record a deletion.
- **"Data handling: Member answers are private. Exports are logged."** at the bottom of every admin screen with member data (Students, Worksheets, Feedback, Coaching, Community, Elite, Payments, Audit log, Data settings), for coaches and admins.
- **Admin exports name who made them:** the worksheet CSV starts with "Exported by [admin] on [date and time] from The BOSS Business System. Member answers are private."; the admin ZIP's README and my-data.json say who exported it and when.
- **Found while testing:** a lesson could hold two published worksheets, and its page then showed either one. Migration `20261104002400_one_published_worksheet_per_lesson.sql` allows one per lesson; publishing a second gives "Another worksheet is already published on this lesson. Archive it first." The test fixtures now use lessons 5 and 6, which have no real worksheet.

| Check | Result |
|---|---|
| lint, typecheck, check:copy, build, local Playwright (44) | Pass |
| `vitest --project unit` | 208 pass (new: CSV stamp line, admin ZIP stamp) |
| `vitest --project db` | 132 pass (new: coach cannot read applicant emails, coach function has no email, admins still can, members get nothing; coaches cannot read orders or deletion requests, export, or record deletions; one published worksheet per lesson) |
| Staging, all browser suites | Worksheet journey 6 of 6 (new: note shown to admin and coach, CSV stamp line, coach sees no "@" on Elite, Deletion requests and Data settings are not found for coaches), data export 3 of 3 (admin README stamp), Module 1 3 of 3, deletion 5 of 5, retention 2 of 2. Staging afterwards: no temporary accounts or test posts; the owner's Module 1 worksheets still published |

## Data rights: owner decisions after Slice C (2026-11-04)

- **Balance owed holds a deletion** (migration `20261104002200_deletion_holds_inactivity_recorded.sql`, applied to staging): payment plan with payments left, or a membership payment past due. The daily job never runs those requests; the card shows "Payments still owed" with each item and "Waits for you"; the member is told the team will review first. Retention for such members opens a request instead of deleting.
- **Accounts with no purchase** are deleted 12 months after the last sign in, with the same reminders and their own wording.
- **Record deletion request** on the admin member page.
- Checks: lint, check:copy, unit 207, db 128; staging deletion suite 5 of 5 (new: owing member left by the job, balance and plan shown, request recorded by an admin), retention suite 2 of 2 including two accounts with no purchase (one deleted after a year without signing in, one kept). Before running, the job's view of staging was checked: every real account it covers is staff (excluded) or due no earlier than November 2027.

## Data rights, Slice C: retention, reminders, privacy text, Data settings (2026-11-04)

- **Rules** in one place, `src/domain/data-rights/retention.ts` (owner defaults): deletion requests within 30 days; after access ends, data and the download stay 12 months, reminders 30 and 7 days before, then the account is deleted by the Slice B process; anonymized purchase records kept 7 years then removed; audit log kept, anonymized; staff never part of retention.
- **When access ended** (`app.access_ended_at`, migration `20261104002100_data_retention.sql`, applied to staging): per grant the earlier of its end date and the moment it stopped counting (revoked, refund or cancellation, payment past the 7 day grace, subscription ended); the latest across grants. Unclear moments use the later time, so data is kept longer, never shorter. Members who come back are not lapsed; members who never had access are not covered (I-86).
- **Daily job** (`/api/cron/data-rights`, renamed from `/api/cron/data-deletion`; `src/lib/server/data-rights-job.ts`): reminders (once per lapse, recorded in `retention_notices`; a failed send is retried the next day; after a missed day only the latest reminder goes), retention deletions (a deletion request with origin "retention", carried out at once, with its own "deleted after 12 months" email), members' requests past 30 days, purchase record purge. Every run is recorded in `job_runs` with counts only.
- **Admin, Data settings** (`/admin/settings/data`, admins only): requests waiting, lapsed members kept, deletions due within 30 days, last run with a warning if none in 36 hours, the rules, and the last 30 runs.
- **Privacy text:** `docs/data-rights/PRIVACY_SECTION.md`, describing exactly what the code does, for the owner to paste into the policy after legal review.

| Check | Result |
|---|---|
| lint, typecheck, check:copy, build, local Playwright (44) | Pass |
| `vitest --project unit` | 205 pass (7 new: the numbers, month arithmetic with short months and leap days, nothing before 30 days, each reminder once, only the latest after a missed run, deletion exactly at 12 months, staff and open requests skipped) |
| `vitest --project db` | 126 pass (5 new: end date for active, never, ended and refunded members; job facts list lapsed members only, mark staff and open requests, server only; runs and reminders admins only; purchase records older than 7 years removed, newer and current members' kept) |
| `tests/e2e/data-retention.spec.ts` on staging (temporary members ended 12 months and a day, 12 months less 20 days and less 5 days ago, and one active) | 2 pass: the job deleted the expired member (cannot sign in), sent one 30 day and one 7 day reminder, left the others signed in; a second run sent nothing and deleted nothing; Data settings shows the rules, counts and both runs. Before running it there, the job's view of staging was checked: no real account was due for a reminder or deletion |

## Owner follow ups to worksheets and data rights Slice B (2026-11-04)

- Worksheet PDFs print each question's guide line, muted, under the question (same question types as the form). No new copy.
- Deleting a member keeps community threads: their posts and replies stay in place, reworded to a removal note, with "Deleted member" as author (migration `20261104002000_deletion_keeps_community_threads.sql`, applied to staging; I-80).
- Deleting a member deletes their Stripe customers first (I-82). Payment plan conflict logged as I-84.
- Checks: lint, typecheck, check:copy, unit 198, db 121 (new: thread kept with others' replies intact), build, local Playwright 44; staging deletion test 4 of 4 with a real Stripe test customer (deleted in Stripe) and a community thread (rewritten, others' replies kept); test posts and accounts cleaned up afterwards.

## Data rights, Slice B: deletion requests (2026-11-04)

- **Member, My Account, Your data:** "Delete my account and data" opens a page that says what is deleted, what is kept and why, and that it is permanent; typing DELETE submits a request. The account then shows "Requested on [date]. Your account will be deleted within 30 days. You'll get an email when it's done." with **Cancel my deletion request** while it is pending.
- **Owner email** on each new request (member's name and the admin link) to OWNER_NOTIFY_EMAIL, or SUPPORT_CONTACT_EMAIL when unset.
- **Admin, Students & access, Deletion requests** (admins only): Pending, Completed, Cancelled. Each pending request shows days until automatic deletion and **Delete now**, which needs the member's email typed. Staff accounts show "This account took admin actions and cannot be hard deleted. It will be anonymized and blocked instead." Completed rows show only the anonymous code.
- **What deletion does** (migration `20261104001900_data_deletion.sql`, applied to staging; `src/lib/server/data-deletion.ts`):
  1. audit entry "deletion.started" before anything changes;
  2. in one transaction: every mention of the member's id or email in the audit log becomes `deleted-user-<10 hex>`; orders keep product, amounts, dates and status with the email replaced by the same code and the account link removed; all member data deleted (worksheets, audit, roadmap, path choices, progress, milestones, coaching, Hot Seat, feedback, community, Elite workspace, access, subscriptions, export records, Elite applications, profile);
  3. stored files deleted; sign in account deleted;
  4. "deletion.completed" entry; confirmation email to the address on file, which is not kept.
  Staff (any role, or named as actor in the audit log): roles removed, profile and sign in email replaced by the code, password scrambled, sign in blocked; never hard deleted (I-73).
- **Daily job:** Vercel Cron (`portal/vercel.json`, 07:17 UTC) calls `/api/cron/data-rights` (renamed in Slice C) with CRON_SECRET. It deletes pending requests past 30 days and finishes any left half done. Answers with counts only.
- **Fixed on the way:** path choices were append only, so no member who had chosen a learning path could ever be deleted. A narrow exception now allows deleting them, and anonymizing audit entries, only inside a deletion run (clients still have no update or delete rights on either table).

| Check | Result |
|---|---|
| lint, typecheck, check:copy, build | Pass |
| `vitest --project unit` | 198 pass |
| `vitest --project db` | 120 pass (7 new: request, reuse and cancel; others and coaches cannot see; only the server can run a deletion; full run with audit and order anonymization, case insensitive email, unrelated entries untouched, path choice removed, sign in account then deletable, steps logged with the code; append only still enforced outside a run; staff anonymized and kept, safe to rerun; cancelled request cannot run) |
| `tests/e2e/data-deletion.spec.ts` on staging | 4 pass: member must type DELETE, sees the pending text, cancels, asks again; admin with a wrong email is refused, with the right one deletes, member cannot sign in, completed tab and audit log show only the code; staff account anonymized and blocked; daily job refuses without the secret and deletes the overdue request. Checked in the database afterwards: no member rows or emails left, orders and audit entries show the code |

## Data rights, Slice A: "Download all my data" (2026-11-04)

Brief: `docs/10_DATA_RIGHTS.md`.

**What already exists (checked in the schema and row security, 2026-11-04)**
- Member data lives in 27 tables. Keyed to the member: profiles, orders (+ order_payments), subscriptions, stripe_customers, entitlements, lesson_progress, milestone_progress, audit_drafts, audit_runs, roadmap_items, path_overrides, worksheet_responses, coaching_questions, hotseat_applications, feedback_submissions, community_posts, community_comments, community_reports, elite_applications, coach_assignments, elite_boards (+ elite_items, elite_item_comments, elite_sessions, elite_checkins, elite_hour_buckets, elite_time_entries, elite_files).
- Member files in private storage: student-evidence (milestone evidence), feedback-files, elite-files.
- Deleting an auth user cascades most member rows. Exceptions: `orders.user_id` and `elite_applications.user_id` become null (records kept, email kept in the row); `admin_audit_log.actor_id` is append only, so deleting anyone it names as actor fails (I-73).
- Row security lets a member read their own rows; worksheets on lessons they can no longer open are hidden, which is why lapsed members could not get their worksheet PDFs (I-65).
- A lapsed member can sign in. Every member page checks access and shows "not part of your current access"; lesson pages and content are blocked by row security; Account, Plans and Billing stay reachable.
- No data export or deletion flow existed (I-59).

**Built**
- Account page "Your data": **Download all my data** gives one ZIP, built on request and never stored:
  - `my-data.json` (profile and email, enrollment, payments, subscriptions, access dates, coach name, audit submissions, drafts, roadmap and path choices, lessons and milestones, every worksheet response with schema version, answers, status and dates, coaching questions, Hot Seat applications, feedback, community posts, comments and reports, Elite application and board);
  - `worksheets/` PDF of every completed worksheet (brand fonts), `audit-report.pdf` for the latest audit, `uploads/` the member's own files, `README.txt` describing exactly what is included.
- Works for lapsed members (and for any signed in account). Built from each response's own worksheet version, so PDFs come even for lessons they can no longer open.
- Admin, Students & access, member page: **Export data** gives the same ZIP. Admins only (coaches and members get a 404).
- Migration `20261104001800_data_export.sql` (applied to staging): `data_exports` records and `start_data_export` / `finish_data_export`. One export per member per 10 minutes (separately for member and admin), a failed one can be retried, and every completed export is written to the audit log with its size and who asked, never content.
- `fflate` added as a direct dependency (already installed through the PDF library).

| Check | Result |
|---|---|
| lint, typecheck, check:copy | Pass |
| `vitest --project unit` | 194 pass (7 new: JSON shape, what is kept, staff only exclusions, no Elite board, ZIP contents and unique names, file names, README matches contents) |
| `vitest --project db` | 113 pass (6 new: self or admin only, coach and anonymous refused, 10 minute limit, failed export frees the limit, audit entry content, only the starter can finish, own records only) |
| `next build`, Playwright local | Pass; 44 pass, staging only specs skipped |
| `tests/e2e/data-export.spec.ts` on staging (temporary members and the shared test admin) | 3 pass: member ZIP has exactly my-data.json, README.txt and the Lesson 1 worksheet PDF with the right answers, and a second click is limited; lapsed member cannot open the lesson but downloads the PDF; admin export from Students & access; signed out 401, member using the admin export 404. Both temporary members deleted afterwards (proves exports do not block deletion) |

## Worksheet test fixtures in the repo (2026-11-04)

- `portal/scripts/staging-worksheet-fixtures.mjs setup|cleanup --suite journey|module1 --env-out FILE` replaces the session only scripts. Staging only (refuses unless sample content is allowed); logins go only to the given file outside the repository.
- The CSV export test no longer leaves a blocked admin per run: one shared test admin is switched on for each run and off afterwards (I-69). Underlying audit log question logged as I-73.
- The module1 suite now restores each worksheet's and milestone's previous status instead of forcing draft, so it never undoes the owner's publishing.
- Checks: journey suite twice in a row on staging (6 pass each, no new accounts); module1 suite once (3 pass, statuses restored); lint and typecheck pass.

## Worksheets, Slice E: Module 1 seed, Lessons 1, 2 and 9, dashboard card (2026-11-04)

- `scripts/seed-worksheets.mjs` (local and staging only; refuses unless the project allows sample content and APP_ENV is not production; safe to rerun):
  - adds `m1-l1-starting-point`, `m1-l2-business-direction` and the Lesson 9 placeholder `m1-l9-foundation-blueprint` as drafts on Module 1 lessons 1, 2 and 9;
  - adds the two milestones Complete ticks ("I answered Lesson 1: Starting Point", "I chose a provisional direction and wrote my hypothesis") as drafts;
  - run on staging 2026-11-04; staging had no Lesson 9, so it added a published "SAMPLE: Module 1 lesson 9" (I-71).
- Publishing: admins move a worksheet through draft, review and published on its Admin, Worksheets page (same controls as lessons). Publishing checks the schema first and explains a clash with another published version. The Curriculum lesson page lists the lesson's worksheet.
- Lesson 9 placeholder: quotes the member's own Lesson 1 q3 and Lesson 2 hypothesis under each heading, shows a note while one is missing, and offers "Download all Module 1 worksheets". Callback quotes now sit under their section heading on every worksheet.
- Dashboard: after the audit, an unfinished worksheet becomes the next step, "Finish your Lesson N worksheet" (I-70).
- Fix: Complete saves any answers still in the autosave pause before completing (I-72).
- **Owner action:** to show the worksheets to members, publish the three worksheets (Admin, Worksheets) and the two milestones (Admin, Curriculum, Module 1).

| Check | Result |
|---|---|
| lint, typecheck, check:copy | Pass |
| `vitest --project unit` | 187 pass (new: seed schemas parse and link up, Lesson 9 callbacks, autosave settle) |
| `vitest --project db` | 107 pass |
| `next build`, Playwright local | Pass; 44 pass, staging only specs skipped |
| `tests/e2e/worksheets-module1.spec.ts` on staging (seeded worksheets and milestones published for the run, then back to draft; temporary member removed) | 3 pass: audit, then "Finish your Lesson 1 worksheet" and its link; Complete straight after typing ticks the milestone and clears the nudge; Lesson 9 quotes both answers and the module PDF downloads |
| `tests/e2e/worksheets.spec.ts` on staging (regression) | 6 pass |

## Worksheets, Slice D: admin views, CSV export, member Library (2026-11-03)

- Admin workspace "Worksheets" (admins and coaches):
  - `/admin/worksheets`: every worksheet with lesson, status, started and complete counts.
  - `/admin/worksheets/[slug]`: counts (started, completed, Weak per rating column), status filter, and a table of member, email (admins only), status, completed date and the schema's `admin_columns` (`{chosen}` resolves to each member's chosen idea; ratings as pills with the note).
  - `/admin/worksheets/[slug]/[responseId]`: the whole worksheet read only (`WorksheetForm` display mode).
- CSV export `GET /api/admin/worksheets/[slug]/csv`: admins only (coaches and members get 404), one column per field key, ratings as `key_rating` and `key_note`, sentences as text, UTF-8 with a byte order mark for Excel, spreadsheet formula protection. Every export is recorded in the audit log with the row count, never answers (migration `20261103001700_worksheet_export_audit.sql`, applied to staging).
- Member Library "Your worksheets" (owner addition): each published worksheet the member can open, grouped by module, with Not started / In progress / Complete, a link to its lesson, the PDF when complete, and "Download all Module N worksheets" once one is complete. Same card styling as the Library items.
- Code: `src/domain/worksheets/admin.ts` (pure), `src/lib/server/worksheets-admin.ts`, `loadMemberWorksheets` in `src/lib/server/worksheets.ts`, `getUserEmails` in `src/lib/server/directory.ts`.

| Check | Result |
|---|---|
| lint, typecheck, check:copy | Pass |
| `vitest --project unit` | 180 pass (8 new in `admin.test.ts`: headers, `{chosen}`, rating cells, Weak counts, CSV columns, quoting and formula guard, file name) |
| `vitest --project db` | 107 pass (new: only admins can record an export; the entry holds slug and row count only) |
| `next build`, Playwright local | Pass; 44 pass, staging only specs skipped |
| `tests/e2e/worksheets.spec.ts` on staging (temporary member, admin and assigned coach) | 6 pass. New: Library statuses, links and PDF downloads; admin list counts, member row with email, ratings and notes, Weak count, filter, read only view, CSV headers and values; coach sees the assigned member without email, no export button, CSV 404 |

## Brand fonts in PDFs (2026-11-03)

- Worksheet PDFs and the audit report now use Cormorant Garamond (headings) and DM Sans (body) instead of Times and Helvetica (I-63).
- `src/lib/pdf/brand-fonts.ts` and `src/lib/pdf/fonts/` (six static Latin subsets, about 370 KB in total, with their open font licenses). `next.config.ts` ships them with the three PDF routes.
- Audit report fixes found while checking it by eye: large headings overlapped the line below (explicit line heights), a heading could sit alone at a page bottom, and its footer never printed (now plain text, no page numbers, I-64).
- Checks: lint, typecheck, check:copy, unit 172, db 106, build, local Playwright 44 pass; worksheet e2e 3 of 3 on staging, and the downloaded PDF embeds only the brand fonts.

## Worksheets, Slice C: PDF export (2026-11-03)

- `src/lib/pdf/worksheet-pdf.tsx`: branded worksheet PDF built only from the member's saved answers (ivory page, plum and mauve, serif headings, section numbers, ratings with notes, the hypothesis sentence, callback quotes).
  - Prints required fields always ("Not answered" when empty) and optional fields only when answered, so unused idea columns are left out.
  - Long answers flow across pages; headings keep at least a few lines with them; very long words (pasted links) break instead of running off the page.
  - Footer on every page: "The BOSS Business System · Module N" and the date.
- Routes (signed in, the member's own answers only, `Cache-Control: private, no-store`):
  - `GET /api/worksheets/[slug]/pdf` gives `BOSS_Module1_Lesson2_Worksheet.pdf`.
  - `GET /api/worksheets/module/[moduleSlug]/pdf` gives `BOSS_Module1_Worksheets.pdf` with every completed worksheet in lesson order; 404 when none are complete.
  - Signed out: 401. Not visible to the member (draft, no access): 404.
- "Download my worksheet" button in the worksheet status bar.
- The "Download all Module 1 worksheets" button is placed in Slice D (Library "Your worksheets") and Slice E (Lesson 9 placeholder).

| Check | Result |
|---|---|
| lint, typecheck, check:copy | Pass |
| `vitest --project unit` | 172 pass (4 new in `worksheet-pdf.test.tsx`: Lesson 2 with long answers, printed fields, module PDF, file names) |
| `vitest --project db` | 106 pass |
| `next build` | Pass |
| Playwright local (staging env unset) | 44 pass, staging only specs skipped |
| `tests/e2e/worksheets.spec.ts` on staging (local build, temporary member and test worksheets, all removed after) | 3 pass. New: lesson PDF downloads with the right name and is a PDF; module PDF returns 200; signed out requests get no PDF. Downloaded file checked by eye: 2 pages, ratings, notes, sentence and footer present |

## Worksheets, Slice B: schema driven form, autosave, progress, complete (2026-11-03)

### What changed
- `src/domain/worksheets/schema.ts`: the worksheet schema (Zod) and pure rules: repeat group expansion, `required_for`, progress from `completion.required_fields`, answer validation (unknown keys, types, lengths, options, dates), sentence rendering (`_rendered` rebuilt on the server), callback text. The two Module 1 schemas from the brief are fixtures in `src/domain/worksheets/fixtures/`.
- Migration `20261103001600_worksheet_save_complete.sql` (applied to staging):
  - `save_worksheet_answers` shallow merges changed answers and follows the published version.
  - `complete_worksheet` keeps the first `completed_at`, stays editable, and ticks the module milestone whose title equals `completion.milestone_label`.
  - Both run as the member, so the RLS from Slice A still applies.
- Server actions `src/app/app/worksheets/actions.ts`: validate every patch against the published schema; complete only at 100% (checked on the server); logs field keys and slugs, never answer content.
- `WorksheetForm` (`src/components/worksheets/`): one component for every worksheet.
  - **Content:** intro with the italic mauve last word, quote and notes; numbered sections with ask, guide and footer; subsections; repeat columns labeled from the idea text.
  - **Field types:** text, textarea, date; rating pills (Strong plum, Uncertain rose, Weak outlined italic mauve) with a note; choice pills labeled from the ideas; inline sentence inputs.
  - **Behavior:** "Hypothetical example:" lines, callbacks quoted above a section, a display mode for staff, and a sticky status bar ("Saved h:mm", "Not saved, retrying", percent complete).
  - **Autosave:** `AutosaveController`, 800 ms per field, one request in flight, latest change queued, backoff retries, and a warning on leaving with unsaved changes.
  - **Progress:** `useWorksheetProgress(slug)`.
- Lesson page: "Your worksheet" section below the video and resources when the lesson has a published worksheet.

### Tests run
| Command | Result |
|---|---|
| `vitest --project unit` | 168 pass (16 schema tests, 4 autosave controller tests) |
| `vitest --project db` | 106 pass (3 new: merge save, refusals, complete with milestone) |
| `tests/e2e/worksheets.spec.ts` on staging (local build, temporary member and test worksheets, all removed after) | 2 pass. Covered: autosave "Saved", progress 0, 8 and 100 percent, rating pills, notes, choice, sentence, date, Complete, still editable; a second browser context sees every answer; the callback quotes the Lesson 2 hypothesis on a later worksheet |
| Local unconfigured Playwright suite | 44 pass |
| lint, typecheck, copy check | pass |

## Worksheets, Slice A: data model and RLS (2026-11-03)

Brief: `09_IMPLEMENT_WORKSHEETS.md` (owner decision 2026-11-02: worksheets live in the portal).

### What changed
- Migration `20261103001500_worksheets.sql`:
  - `worksheets`: slug and version (unique together), `lesson_id` FK, schema jsonb, `content_status`; one published version per slug.
  - `worksheet_responses`: one per member per worksheet, answers jsonb (object, at most 200 KB), `in_progress`/`complete`, `completed_at`; FK to the worksheet version.
  - Plumbing: `updated_at` triggers, staff audit trail on worksheets, and a delete-only audit on responses (records `{"deleted": true}`, never answer text).
  - A guard so a response cannot move to another account or worksheet.
- RLS:
  - **Worksheets:** students see only published worksheets whose lesson is visible to them (reuses `app.lesson_visible_to_student`); staff read all; only admins write.
  - **Responses:** a member reads their own always; they create or update their own only while the worksheet is published and visible to them. The assigned coach reads (D09); admins read all; only admins delete.
- Not applied to staging yet (waiting for owner review of this slice).

### Tests run
| Command | Result |
|---|---|
| `vitest --project db` | 103 pass (11 new in `tests/db/worksheets.test.ts`: student, other student, anonymous, unentitled, draft/review hidden, assigned and unassigned coach, admin, audited delete without content) |
| `vitest --project unit` | 148 pass |
| lint, typecheck | pass |

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
| Staging (2026-11-02) `scripts/staging-permission-check.mjs` | 113 of 113 pass: entitlements, billing records, audit privacy, coaching, community, feedback, Elite isolation, admin powers, all six roles |
| Staging (2026-11-02) `signed-in.spec.ts` + `staging-roles.spec.ts` | 41 pass, 1 skipped by design (desktop and mobile) |
| Local (2026-11-02) full Playwright suite, unconfigured | 44 pass, 50 signed in skipped |
| Staging (2026-11-02) Stripe test mode: pay in full purchase and refund on the deployed site | pass (grant 12 months; refund revokes immediately) |
| Staging (2026-11-02) six payment lifecycle with Stripe test clock | pass after fix I-49: grace exactly 7 days, cure keeps dates, stops after 6th, no 7th invoice |
| Local (2026-11-02) `vitest --project db` | 89 pass (adds 2 concurrent webhook tests) |
| Local (2026-11-02) `vitest --project unit`, check:copy, lint, typecheck | pass (145 unit tests) |

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
