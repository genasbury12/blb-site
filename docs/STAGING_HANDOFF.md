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
3. **Test accounts:** ask her which inbox to use (base email for plus addressing). Then run `portal/scripts/provision-test-accounts.mjs` with:
   - `APP_ENV=staging`
   - `NEXT_PUBLIC_SUPABASE_URL=$STAGING_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY=$STAGING_SUPABASE_SECRET_KEY`
   - flags: `--email <her email> --with-sample-content`

   Passwords print once. Do **not** paste them in chat. Instead, save them to a file in the session scratchpad only, and tell her to copy them into her password manager. Alternatively, ask her to reset each password herself via "Forgot password" after the email is set up. Decide the safest option.
4. **Supabase auth settings (owner):** Authentication, URL Configuration (Site URL and redirect `https://STAGING/auth/confirm`); email templates using `token_hash` (see `OWNER_SETUP.md` Step 1); minimum password length 10; confirm email on.
5. **Vercel (owner):** see `OWNER_SETUP.md` Step 2. Root Directory `portal`, Deployment Protection on, env vars from the table. Then add `*.vercel.app` (or the exact staging host) to the allowed domains so the signed in Playwright tests can run against staging, using a Vercel "Protection Bypass for Automation" secret stored as the env var `VERCEL_AUTOMATION_BYPASS_SECRET` (the Playwright config needs the `x-vercel-protection-bypass` header).
6. **Stripe test mode (owner):** see `OWNER_SETUP.md` Step 3.
7. **Run** the signed in E2E suite (`E2E_SUPABASE=1`), extend it to cover the audit, roadmap, lessons, payments (test mode), coaching access, feedback limits, community and Elite permissions, fix bugs, then walk her through the portal as a student and an admin.

Keep `docs/BUILD_STATUS.md` and `docs/IMPLEMENTATION_ISSUES.md` updated, and commit to the branch assigned to the current session (2026-11-02 session: `claude/great-rubin-drnnj9`; earlier work was on `claude/blb-site-images-folder-5nm2vd`).
