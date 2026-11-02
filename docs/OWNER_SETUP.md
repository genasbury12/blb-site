# Owner setup: from code to a private staging portal

You create the accounts, I write the code. **Never paste a key, password, or token into chat.** Every secret goes into the settings pages named below.
Everything here is **test mode and private**. No real charges, no public site, no emails to customers.

Estimated time: about 60 to 90 minutes in one sitting.

---

## Step 1. Supabase (accounts and database), about 15 minutes

1. Go to https://supabase.com/dashboard/new and sign in with GitHub.
2. Create a project:
   - Name: `boss-portal-staging`
   - Database password: click **Generate**, then save it in your password manager.
   - Region: **East US (North Virginia)**.
   - Click **Create new project** and wait about two minutes.
3. Open **Project Settings, then API Keys** and keep the tab open. You need two values:
   - Project URL
   - Publishable key (`anon`)
   - Also find the `service_role` secret. It is shown once you click **Reveal**. Never share it.
4. Open **Authentication, then URL Configuration**. Set **Site URL** to the staging URL from Step 2. You can come back to this.
   - Under **Redirect URLs**, add `https://YOUR-STAGING-URL/auth/confirm`.
5. Open **Authentication, then Emails, then Templates**.
   - In **Confirm signup**, change the link to:
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
   - In **Reset password**, change the link to:
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
6. Open **Authentication, then Sign In / Providers, then Email**.
   - Confirm that **Confirm email** is on.
   - Set the minimum password length to **10**.

## Step 2. Vercel (private staging site), about 15 minutes

1. Go to https://vercel.com/new and sign in with GitHub.
2. Import `genasbury12/blb-site`. If it is not listed, click **Adjust GitHub App Permissions** and allow that repository.
3. Before you deploy:
   - **Root Directory:** click **Edit** and choose `portal`.
   - **Framework:** Next.js (detected automatically).
   - **Environment Variables:** add each line of the table below.
4. Click **Deploy**.
5. Then open **Settings, then Deployment Protection** and turn on **Vercel Authentication** for all deployments, including production. This keeps the site private to you and people you invite. It is how we stay "not public".
6. Your staging URL is the deployment URL Vercel shows, for example `https://blb-site-xxxx.vercel.app`. Put it in `NEXT_PUBLIC_SITE_URL` and in Supabase Step 1.4.

| Variable | Value |
|---|---|
| `APP_ENV` | `staging` |
| `NEXT_PUBLIC_SITE_URL` | your Vercel staging URL |
| `SUPPORT_CONTACT_EMAIL` | the support inbox you want members to use |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role secret |
| `FEATURE_COACHING`, `FEATURE_COMMUNITY`, `FEATURE_FEEDBACK`, `FEATURE_ELITE` | `true` |
| `FEATURE_BILLING` | `true` after Step 3 |
| `EMAIL_SENDING_ENABLED` | `false` for now |

## Step 3. Stripe in TEST mode (payments), about 20 minutes

1. Go to https://dashboard.stripe.com/register.
   - Create the account.
   - Make sure the **Test mode** toggle (top right) is on for every step below.
2. Create the products at https://dashboard.stripe.com/test/products, then **Add product**. Use these exact amounts. All are USD.

   | Product | Price | Billing |
   |---|---|---|
   | BOSS Blueprint | $497 | One time |
   | BOSS Blueprint (six payments) | $97 | Recurring, monthly |
   | BOSS Accelerator | $1,497 | One time |
   | BOSS Accelerator (six payments) | $297 | Recurring, monthly |
   | BOSS Elite | $4,997 | One time |
   | BOSS Elite (six payments) | $897 | Recurring, monthly |
   | Graduate Coaching Membership | $97 | Recurring, monthly |
   | Elite Board Retention | $97 | Recurring, monthly |

3. Copy each price ID (it starts with `price_`).
   - In the portal, sign in as the test admin (Step 5) and open **Admin, then Payments**.
   - Paste each ID next to the matching row.
4. Get the API keys at https://dashboard.stripe.com/test/apikeys.
   - Copy the **Secret key**. It must start with `sk_test_`.
   - Add it in Vercel as `STRIPE_SECRET_KEY`.
5. Set up the webhook at https://dashboard.stripe.com/test/webhooks, then **Add endpoint**.
   - Endpoint URL: `https://YOUR-STAGING-URL/api/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.expired`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `invoice_payment.paid`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `charge.refunded`
     - `charge.dispute.created`
     - `charge.dispute.updated`
     - `charge.dispute.closed`
   - Copy the **Signing secret** (it starts with `whsec_`) into Vercel as `STRIPE_WEBHOOK_SECRET`.
6. Set failed payment behavior at https://dashboard.stripe.com/test/settings/billing/automatic.
   - Under **Subscription status**, find "if all retries for a payment fail" and choose **leave the subscription past due**.
7. Configure the customer portal at https://dashboard.stripe.com/test/settings/billing/portal.
   - Turn **off** "Customers can cancel subscriptions". Six payment plans must not be cancelable there. Memberships are canceled from the portal's Billing page instead.
   - Save, copy the configuration ID if one is shown, and add it in Vercel as `STRIPE_PORTAL_CONFIGURATION_ID`.
8. In Vercel set `FEATURE_BILLING=true` and redeploy (**Deployments, then the latest deployment, then Redeploy**).

Live mode stays off. The app refuses a live key unless `STRIPE_LIVE_MODE_APPROVAL=approved-by-owner` is set, and you should only set that after the launch review.

## Step 4. Apply the database structure, about 5 minutes

Choose one option.

- **Option A (I do it).** Add these as environment variables in this Claude Code environment: the cloud environment menu in the session title bar, then **Edit**.
  - Variables:
    - `STAGING_SUPABASE_DB_URL`: in Supabase, open **Connect, then Session pooler**, and copy the connection string with your database password filled in.
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
  - Under **Network access**, allow `supabase.co` and `supabase.com`.
  - Start a new session and tell me "staging secrets are in". I will apply the migrations, create the test accounts, and run the signed in browser tests against staging.
- **Option B (you do it).** On a computer with Node.js 22:

  ```bash
  git clone https://github.com/genasbury12/blb-site && cd blb-site/portal && npm ci
  npx supabase link --project-ref YOUR_PROJECT_REF   # asks for the database password
  npx supabase db push                                # applies every migration
  ```

## Step 5. Test accounts, about 2 minutes

Run this with the staging values (Option B), or ask me to (Option A):

```bash
APP_ENV=staging NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  npm run provision:test-accounts -- --email you@yourdomain.com --with-sample-content
```

It creates six confirmed accounts on plus addresses of your inbox: admin, coach, blueprint, accelerator, elite, and noaccess.
- Their random passwords print once in the terminal. Save them in your password manager.
- Program access is created through the real billing code with clearly marked test fixture ids. No Stripe charge happens.
- `--with-sample-content` publishes SAMPLE lessons for walkthroughs. They are clearly badged and can never be published in production.

## Step 6. Optional services (needed before launch, not for staging review)

| Service | Sign up | What to add in Vercel |
|---|---|---|
| Resend (email) | https://resend.com/signup, then verify your sending domain at https://resend.com/domains | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TEST_ALLOWLIST` (your test inboxes), then `EMAIL_SENDING_ENABLED=true` |
| Mux (lesson video) | https://dashboard.mux.com/signup, then **Settings, Signing Keys, Generate new key** | `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_PRIVATE_KEY` (the base64 private key exactly as Mux shows it) |
| Sentry (error reports) | https://sentry.io/signup/, then create a Next.js project | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |

In Supabase, also open **Authentication, then Emails, then SMTP Settings** and use Resend's SMTP details, so confirmation and reset emails come from your domain.

## Stripe test scenarios to try

Test cards are listed at https://docs.stripe.com/testing.

| Scenario | How |
|---|---|
| Successful payment | Card `4242 4242 4242 4242`, any future date, any CVC |
| Failed installment and seven day grace | Start a six payment plan with `4242...`, then in Billing, **Manage payment method**, switch to `4000 0000 0000 0341` (it attaches but every charge fails). The next monthly charge fails and the grace notice appears. Waiting a month is slow, so see the next row |
| A full six month lifecycle in minutes | Stripe test clocks (https://dashboard.stripe.com/test/billing/subscriptions/test-clocks) only work for customers created on a clock. Add `STRIPE_SECRET_KEY` (test) to this Claude environment and I will run a scripted test clock scenario: six payments, a failure, a cure, and the automatic stop after the sixth payment, and report the results |
| Refund | Refund the payment in the Stripe dashboard. Access ends within a minute |
| Dispute | Pay with `4000 0000 0000 0259`. Access pauses immediately and appears in Admin, then Payments |
