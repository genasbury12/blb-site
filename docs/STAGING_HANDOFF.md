# Staging handoff (read this first in a new session)

The owner (non-developer) is setting up a **private staging environment** one step at a time and wants **one step per reply, waiting for confirmation before the next**. Never ask for keys in chat. Never activate live billing or make staging public.

## Done so far
1. Supabase project `boss-portal-staging` created (East US, Free plan).
2. The owner saved four values in her password manager: Project URL, Publishable key (`sb_publishable_...`), Secret key (`sb_secret_...`), and a Supabase personal access token (`sbp_...`, named "Claude staging setup", about 30 days). **Remind her to delete that token when setup is done:** https://supabase.com/dashboard/account/tokens
3. She was asked to add them to this Claude environment's settings as these environment variables:
   - `STAGING_SUPABASE_URL`
   - `STAGING_SUPABASE_PUBLISHABLE_KEY`
   - `STAGING_SUPABASE_SECRET_KEY`
   - `SUPABASE_ACCESS_TOKEN` (the Supabase CLI and Management API read this name)

   She also added the network allowed domains `supabase.co`, `*.supabase.co`, `supabase.com`, `*.supabase.com`.
4. **Verified (2026-11-02):** all four env vars set with the expected prefixes; Management API reaches `boss-portal-staging` (us-east-1, ACTIVE_HEALTHY, Postgres 17); project REST and auth endpoints reachable.
5. **Migrations applied (2026-11-02):** all 12 files in `portal/supabase/migrations` applied with `python3 portal/scripts/apply-staging-migrations.py portal/supabase/migrations` (run from repo root, or from `portal/` with `supabase/migrations`). Each file runs in one transaction with its `supabase_migrations.schema_migrations` record; recorded versions are skipped on rerun, so use the same command for future migrations. `seed.sql` NOT run. Verified: 12 versions recorded, 47 public tables all with RLS (app schema too), 30 audit questions, 8 prices, 5 products, 8 module shells, 0 lessons, 0 users, 4 private buckets (`elite-files`, `feedback-files`, `lesson-resources`, `student-evidence`) with no `storage.objects` policies. Live anonymous REST check with the publishable key: only `products`, `prices`, `product_features` return rows (intended for the pricing page); anonymous `rpc/my_features` refused (401).

6. **Test accounts created (2026-11-02):** plus addressing verified on the owner's Google Workspace inbox (a self-sent test reached the inbox, then was trashed). Six accounts `hello+boss-{admin,coach,blueprint,accelerator,elite,noaccess}@bossladybloggers.com`, confirmed, created with `--with-sample-content` (21 SAMPLE lessons, 8 SAMPLE milestones, all modules published). Purchases went through `billing_apply_checkout` with `cs_test_fixture_` ids (no Stripe call). Passwords were written only to an owner-only file in that session's scratchpad (never printed or committed); the owner copies them to her password manager. A later session will not have that file: ask the owner to add the passwords as environment variables `E2E_<ROLE>_EMAIL` / `E2E_<ROLE>_PASSWORD` (ROLE = ADMIN, COACH, BLUEPRINT, ACCELERATOR, ELITE, NOACCESS), or rerun provisioning with `--out` (it resets passwords of existing accounts).
7. **Signed in testing on staging (2026-11-02):** `scripts/staging-permission-check.mjs` (113 checks, real sign ins, adds labeled "STAGING TEST" coaching sessions, a replay, a SAMPLE workshop, an Elite roadmap item, a coach only note and a private call) passed 113 of 113. Browser: `signed-in.spec.ts` and `staging-roles.spec.ts` passed 41 (desktop and mobile; the audit writing test runs on desktop only). Bug fixed: Next.js `connection()` in the Supabase server client (I-41). Open owner decision: where staff land after sign in (I-43).

8. **Auth settings (2026-11-02, via Management API `PATCH /v1/projects/{ref}/config/auth`):** minimum password length set 6 -> 10. Confirm email was already on. Email template change REFUSED by Supabase: "Email template modification is not available for free tier projects using the default email provider" (needs custom SMTP such as Resend, D16, or a paid plan). Templates still use `{{ .ConfirmationURL }}`. Site URL is still `http://localhost:3000` and the redirect allow list is empty; set both after Vercel. Backup of the previous values was kept in that session's scratchpad only. Owner chose Resend SMTP (I-45, option b).
9. **Resend SMTP connected (2026-11-02):** Resend account on hello@bossladybloggers.com; sending domain `mail.bossladybloggers.com` (region us-east-1) verified with DKIM TXT `resend._domainkey.mail` and CNAMEs `rsend.mail`, `send.mail` at SiteGround DNS (Google Workspace mail on the root domain untouched). Resend API key "Supabase staging email" (sending access, that domain only) stored only in the owner's password manager and Supabase SMTP settings. Supabase SMTP: `smtp.resend.com:465`, user `resend`, sender `no-reply@mail.bossladybloggers.com`, name "The BOSS Business System". Templates now link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup|recovery`; email rate limit 30 per hour. End to end test: a recovery email for the noaccess account arrived in the Gmail Primary inbox (not spam); trashed because Site URL is still localhost. Remaining for auth: Site URL and redirect allow list after Vercel.

## How to run the staging checks from this container
- Map env: `APP_ENV=staging NEXT_PUBLIC_SUPABASE_URL=$STAGING_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$STAGING_SUPABASE_PUBLISHABLE_KEY SUPABASE_SERVICE_ROLE_KEY=$STAGING_SUPABASE_SECRET_KEY NODE_USE_ENV_PROXY=1` (Node's fetch needs `NODE_USE_ENV_PROXY=1` to use the agent proxy), plus `FEATURE_COACHING=true FEATURE_COMMUNITY=true FEATURE_FEEDBACK=true FEATURE_ELITE=true`, `EMAIL_SENDING_ENABLED=false`, no Stripe key.
- Permission check: `node scripts/staging-permission-check.mjs --creds FILE` (FILE is the provisioning `--out` file).
- Browser: `npm run build`, then with `E2E_SUPABASE=1` and the `E2E_<ROLE>_*` variables, `npx playwright test tests/e2e/signed-in.spec.ts tests/e2e/staging-roles.spec.ts`. The public suite (`public-and-guards.spec.ts`) expects an unconfigured local build; run it without the staging variables.
- Never print the creds file or the `E2E_*_PASSWORD` variables.

## Network facts in this cloud container
- There is no direct Postgres (TCP) access. Outbound traffic is HTTPS only, through the agent proxy, and only to allowed domains.
- So apply migrations through the Supabase Management API over HTTPS:
  - `POST https://api.supabase.com/v1/projects/{ref}/database/query` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` and the JSON body `{"query": "<sql>"}`.
  - `{ref}` is the subdomain of `STAGING_SUPABASE_URL`.
- No Docker. Local tests use PostgreSQL 16: `sudo pg_ctlcluster 16 main start`, then `TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres`.

## Next steps, in order (one per reply to the owner)
1. ~~**Verify** the four env vars exist (print only whether each is set, never the values) and that `https://api.supabase.com` and the project URL are reachable. If not, read the environment documentation and guide her to fix it.~~ Done.
2. ~~**Apply migrations** to staging~~ Done (see item 5 above):
   - Apply `portal/supabase/migrations/*.sql` in order through the Management API.
   - Record each one in `supabase_migrations.schema_migrations` (create the schema and table if missing, with columns `version text primary key, name text, statements text[]`), so the Supabase CLI agrees later.
   - **Do not run `supabase/seed.sql`** (staging content comes from the provisioning script).
   - Verify: RLS enabled on every public table, the 30 audit questions present, the 8 prices present, the storage buckets present.
3. ~~**Test accounts**~~ Done (items 6 and 7 above). Original instructions: ask her which inbox to use (base email for plus addressing). Then run `portal/scripts/provision-test-accounts.mjs` with:
   - `APP_ENV=staging`
   - `NEXT_PUBLIC_SUPABASE_URL=$STAGING_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY=$STAGING_SUPABASE_SECRET_KEY`
   - flags: `--email <her email> --with-sample-content`

   Passwords print once. Do **not** paste them in chat. Instead, save them to a file in the session scratchpad only, and tell her to copy them into her password manager. Alternatively, ask her to reset each password herself via "Forgot password" after the email is set up. Decide the safest option.
4. ~~**Supabase auth settings (owner)**~~ Done except Site URL and redirect (items 8 and 9 above; set them right after Vercel). Original: Authentication, URL Configuration (Site URL and redirect `https://STAGING/auth/confirm`); email templates using `token_hash` (see `OWNER_SETUP.md` Step 1); minimum password length 10; confirm email on.
5. **Vercel (owner):** see `OWNER_SETUP.md` Step 2. Root Directory `portal`, Deployment Protection on, env vars from the table. Then add `*.vercel.app` (or the exact staging host) to the allowed domains so the signed in Playwright tests can run against staging, using a Vercel "Protection Bypass for Automation" secret stored as the env var `VERCEL_AUTOMATION_BYPASS_SECRET` (the Playwright config needs the `x-vercel-protection-bypass` header).
6. **Stripe test mode (owner):** see `OWNER_SETUP.md` Step 3.
7. **Run** the signed in E2E suite (`E2E_SUPABASE=1`; six role coverage now exists in `staging-roles.spec.ts`), extend it to cover payments through Stripe test mode once Step 6 is done, feedback submission and response, Hot Seat, community posting in the browser, fix bugs, then walk her through the portal as a student and an admin.

Keep `docs/BUILD_STATUS.md` and `docs/IMPLEMENTATION_ISSUES.md` updated, and commit to the branch assigned to the current session (2026-11-02 session: `claude/great-rubin-drnnj9`; earlier work was on `claude/blb-site-images-folder-5nm2vd`).
