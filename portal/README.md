# The BOSS Business System: member portal

Custom Next.js + Supabase + Stripe application for The BOSS Business System (Boss Lady Bloggers).
Specifications: `../docs/handoff/`, `../docs/phase2/`, `../CLAUDE.md`. Status: `../docs/BUILD_STATUS.md`. Open issues: `../docs/IMPLEMENTATION_ISSUES.md`.

Nothing here is deployed. Live billing, live email, and production deployment require explicit owner approval.

## Requirements
- Node.js 22.12 or newer 22.x, npm 10
- PostgreSQL 16 for database tests (or Docker for the full local Supabase stack)

## Run locally
```bash
cd portal
npm ci
cp .env.example .env.local   # fill in values from your own Supabase/Stripe test projects
npm run dev                   # http://localhost:3000
```
Without Supabase values the app runs, public pages render, and every member route redirects to sign in, which shows that authentication is not configured.

### Full local Supabase (needs Docker)
```bash
npx supabase start            # prints local URL and keys for .env.local
npx supabase db reset         # applies migrations + seed.sql (SAMPLE content, local only)
```

## Checks (definition of done)
```bash
npm run lint
npm run typecheck
npm test            # unit tests + database authorization tests (needs TEST_DATABASE_URL)
npm run build
npm run test:e2e    # Playwright against the production build
npm run check:copy  # no em/en dashes or emojis in user facing source
```

## Database tests
`npm test` includes RLS and entitlement tests that run real SQL as `anon` and `authenticated` users.
Point `TEST_DATABASE_URL` at a PostgreSQL 16 superuser connection; a throwaway database is created and dropped:
```bash
export TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres
npm run db:test:setup   # checks the connection
npm test
```
The test database gets `supabase/tests/supabase_shim.sql` (Supabase roles, `auth.uid()`, default grants; TEST ONLY), every migration in order, then `supabase/seed.sql`.

## Staging test accounts
`npm run provision:test-accounts -- --email you@yourdomain.com --with-sample-content` with `APP_ENV=staging`, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set. See `../docs/OWNER_SETUP.md` Step 5.

## Migrations
- Create: `npx supabase migration new <name>`
- Apply to a hosted project (owner approval required for production): `npx supabase link --project-ref <ref>` then `npx supabase db push`
- Never run `supabase/seed.sql` against production. It enables SAMPLE content.

## Environment variables
See `.env.example` for the full list and meaning. Secrets go in Vercel project settings (encrypted), never in git or chat. Live Stripe keys are refused unless `STRIPE_LIVE_MODE_APPROVAL=approved-by-owner`.

## Deployment (Vercel, after owner approval)
1. Import the GitHub repo in Vercel and set **Root Directory** to `portal`.
2. Add environment variables per environment (Preview uses Supabase staging + Stripe test).
3. Apply migrations to the matching Supabase project with `supabase db push`.
4. Production stays blocked until credentials, approved legal policies, real training content, and QA sign off exist (D18).
