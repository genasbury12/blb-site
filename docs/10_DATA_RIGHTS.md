# 10 — Member data rights: export, deletion, retention

**For:** the BLB portal (Next.js / Supabase) Claude Code session
**Why now:** the portal stores every student's worksheet answers, audit, milestones and PDFs. Before a paying student's data goes in, she must be able to get a copy of it and have it deleted. US state privacy laws (California, Virginia, Colorado and others) and GDPR for any EU buyer require both. This is a launch blocker, not a feature.
**Scope:** member self-service export, member deletion request with admin approval, retention and a lapsed-member download window, admin tooling. No new product features.
**Rule:** slices, same as the worksheet project. Stop after each slice for review. Nothing merges until Genasys says so.

---

## What already exists (confirm, don't assume)

- `worksheet_responses`, audit submissions, milestones, user profile, roles, assignments (coach → member), the append-only audit log, PDF routes for worksheets and the audit report.
- Lapsed members currently cannot download PDFs. The audit log cannot be edited and names the acting user, so accounts that took admin actions cannot be hard-deleted (decision logged in Slice E follow-up).

Read the actual schema and RLS before writing a line. List what you find in the Slice A report.

---

## Slice A — Member data export ("Download everything")

**Member-facing:** Settings (or Account) page gets a section **Your data**.
- Button **Download all my data**. Produces one ZIP:
  - `my-data.json`: profile fields, every worksheet response (schema version, answers, status, timestamps), audit submission, milestones, enrollment/tier, assigned coach (name only), export timestamp.
  - `worksheets/` — the PDF of every completed worksheet, using the existing PDF route.
  - `audit-report.pdf` if an audit exists.
  - `README.txt`: one paragraph in plain English saying what the files are and the date.
- Generated on request, server-side, streamed; not stored. If generation takes more than a few seconds, show a progress state, don't time out.
- Every export is written to the audit log: who, when, byte size. Never the content.
- Rate limit: one export per member per 10 minutes.

**Works for lapsed members.** A member whose access has ended can still sign in to the Account page and use this button for **12 months** after access ends. That is the lapsed-member download window the worksheet project left open. Nothing else in the portal is reachable for them.

**Admin:** Admin → Students & access → member row → **Export data** does the same ZIP for that member. Audit-logged. Admins only, not coaches.

**Tests:** unit test for the JSON shape; browser test that a member downloads the ZIP and it contains the right file count; a lapsed member can download and cannot open a lesson.

## Slice B — Deletion request

**Member-facing:** same **Your data** section, button **Delete my account and data**.
- Confirmation screen states in plain English what will be deleted, what will be kept and why (see Retention), and that it is permanent. Requires typing DELETE.
- Submits a **deletion request**, status `pending`. Member sees "Requested on [date]. Your account will be deleted within 30 days. You'll get an email when it's done." Member can cancel while pending.
- Email to Genasys (existing transactional email) with the member's name and the admin link.

**Admin:** Admin → Students & access gets a **Deletion requests** tab: pending, completed, cancelled. Each pending row has **Delete now**. Requires typing the member's email to confirm.

**What deletion does** (one database function, transactional, audit-logged before it runs):
1. Deletes worksheet responses, audit submissions, milestone progress, coach assignments, profile fields, stored PDFs or generated files, notification preferences.
2. Deletes the Supabase auth user.
3. Keeps only: the audit-log rows (append-only, by design), with the user id replaced by a stable anonymous token (`deleted-user-<short hash>`) so the log stays consistent but names nobody; the purchase/enrollment record needed for tax and refund records, with name and email replaced by that same token.
4. Sends the confirmation email to the address on file, then forgets the address.

**If the member took admin actions** (staff): the hard delete is blocked by the audit-log rule. The function must detect this, refuse cleanly, and the admin screen must say "This account took admin actions and cannot be hard-deleted. It will be anonymized and blocked instead." Then do exactly that: strip roles, block sign-in, anonymize profile and email.

**Auto-run:** a scheduled job runs daily and executes any pending request older than 30 days that an admin hasn't acted on. Genasys should never be the reason a legal deadline is missed.

**Tests:** member requests and cancels; member requests, admin deletes, member cannot sign in, audit log shows the anonymous token; staff account path anonymizes instead; 30-day auto-run.

## Slice C — Retention and the privacy page text

**Retention rules**, implemented as a daily job and documented in the admin:
- Active members: data kept while enrolled.
- Lapsed members: data and download access kept **12 months** after access ends, then the account is treated as a deletion request and processed by the Slice B function. Email the member 30 days before and 7 days before, with the download link.
- Audit log: kept indefinitely, anonymized per Slice B.
- Purchase records: kept 7 years (tax), anonymized per Slice B.

**Privacy page text:** produce a plain-English section for the site's privacy policy that states exactly what the code does: what is collected, the export button, the deletion request and 30-day window, the 12-month lapsed retention, what is kept and why. Genasys pastes it into the existing policy. Do not write legal boilerplate; describe the real behavior.

**Admin → Settings → Data** page: shows the retention numbers, how many pending deletion requests exist, when the daily job last ran, and a log of its last 30 runs.

**Tests:** job picks up a member lapsed 12 months and processes them; reminder emails fire at 30 and 7 days; nothing happens to active members.

## Slice D — Coach and admin data boundaries (small)

- Coaches can never export, never see deletion requests, never see a member's email anywhere (already true in worksheets; make it true everywhere).
- Every admin screen that shows member data gets a one-line "Data handling" note at the bottom: "Member answers are private. Exports are logged."
- Admin exports (CSV from worksheets, ZIP from Students & access) include a header row or README line with the export date and the admin's name, so a leaked file is traceable.

---

## Defaults Genasys has not changed

- Deletion window: 30 days.
- Lapsed download window: 12 months.
- Purchase record retention: 7 years.
- Staff accounts: anonymize and block, never hard-delete.

If any of these should differ, she'll say so in the Slice A reply.

## Report format

Same as the worksheet project: what was built, what was tested and where, deviations from this brief, decisions to confirm. Screenshots of the member-facing screens. Stop after each slice.
