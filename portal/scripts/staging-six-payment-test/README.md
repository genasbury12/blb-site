# Staging six payment lifecycle test (Stripe test clock)

Exercises the real deployed site and the real Stripe sandbox: a member buys "Six payments of $97" through
Stripe Checkout, then a Stripe test clock advances month by month. Last run and results: `docs/STAGING_HANDOFF.md` item 16.

Requirements: `STAGING_STRIPE_SECRET_KEY` (sandbox `sk_test_` only; the scripts refuse anything else),
`STAGING_SUPABASE_URL`, `STAGING_SUPABASE_SECRET_KEY`, `SUPABASE_ACCESS_TOKEN`, network access to Stripe and the
staging site. Run from this folder with `NODE_USE_ENV_PROXY=1` in the cloud container (node_modules from `portal/`).

1. `node setup.mjs` creates a member (example.invalid, never emailed) and a test clock customer.
2. `node a2_checkout.mjs` signs in on the deployed site, clicks "Six payments of $97", pays with card 4242.
3. `node advance.mjs` once per month. Before a month you want to fail: `node use_card.mjs pm_card_chargeCustomerFail`.
4. Grace: query `app.has_feature(feature, user, at)` at due date + 3 days and + 8 days.
5. Cure: `node use_card.mjs pm_card_visa && node cure.mjs`.
6. Continue `advance.mjs` to six, then `node no_seventh.mjs`.
7. `node cleanup.mjs` expires leftover sessions and deletes the clock.
`b_repair.mjs` replays checkout linking for an order whose first invoice was left unlinked (the I-49 race).
