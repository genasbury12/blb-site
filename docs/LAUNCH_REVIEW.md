# Review and approval before launch

D18: no customer beta, no production deployment, no live billing, and no live email until you approve in writing.
Work through this list on the private staging site. Mark each item with your initials and a date.

## A. Staging is ready (from `OWNER_SETUP.md`)
- [ ] Supabase project created, migrations applied, Vercel deployment protected (private).
- [ ] Six test accounts provisioned. Passwords are in your password manager.
- [ ] Stripe test mode connected: prices mapped in Admin, Payments, and the webhook shows successful deliveries.
- [ ] Signed in browser tests run against staging with `E2E_SUPABASE=1` and passed. I will report the results.

## B. Walk the member experience (desktop and phone)
Sign in as each test account and check the following.
- [ ] **No access:** account and billing pages work; training says access is not active.
- [ ] **Blueprint:** dashboard, audit (leave halfway, sign out, sign in, resume), report and PDF, training, library, roadmap. You do **not** see coaching, community, feedback, or Elite.
- [ ] **Accelerator:** everything above plus the coaching hub, workshops, Hot Seat application, feedback (try a third submission in one cycle; it is refused), and community (post, reply, report).
- [ ] **Elite:** the workspace (check-in, request, task, hours) plus everything in Accelerator.
- [ ] **Coach:** sees only assigned members and boards; can respond to feedback, moderate, and schedule.
- [ ] **Admin:** create a lesson, send it to review, approve, publish, and see it as a student. Comp access with a reason and find it in the audit log.
- [ ] Keyboard only: complete the audit with Tab, arrow keys, and Enter. Check that focus is always visible.

## C. Payments (Stripe test mode)
- [ ] Pay in full and six payment checkouts grant access within a minute.
- [ ] Failed payment shows the grace notice; after the grace period access pauses; paying restores it.
- [ ] Refund removes access. A partial refund appears in Payments, Needs review.
- [ ] A dispute pauses access immediately.
- [ ] I ran the scripted test clock scenario: billing stopped after the sixth payment.
- [ ] Graduate and Board memberships: join, cancel at period end, resume.

## D. Content and copy (owner)
- [ ] All eight modules have real lessons with video, captions, transcripts, and worksheets. No SAMPLE content remains.
- [ ] Six prerecorded workshops are uploaded and published.
- [ ] Every item in `COPY_REVIEW.md` is approved or edited.
- [ ] Logo and monogram supplied (optional; the text wordmark works until then).

## E. Legal and policy (owner and counsel)
- [ ] Terms, privacy policy, and refund policy approved and replaced in the portal.
- [ ] Six payment commitment wording on checkout approved.
- [ ] Hot Seat recording consent wording approved.
- [ ] Elite service agreement covers rescheduling, missed check-ins, and DFY scope (I-40).
- [ ] Tax setup reviewed by a professional before Stripe Tax is enabled (D04).
- [ ] Decisions marked NEEDS OWNER in `IMPLEMENTATION_ISSUES.md` resolved.

## F. Operations
- [ ] Resend domain verified. Test emails arrive for confirmation, reset, feedback ready, and Hot Seat decision.
- [ ] Mux videos play with captions on desktop and phone.
- [ ] Sentry receives a test error with no personal data.
- [ ] Backups: Supabase daily backups on (Pro plan); a restore was drilled into a scratch project; RPO and RTO of 24 hours confirmed (D15).
- [ ] Support inbox monitored on Tuesdays and Thursdays.

## G. Go live (only after A to F)
1. Create the production Supabase project and apply the migrations. Do **not** run `seed.sql`.
2. In Stripe live mode, create the same eight prices and webhook, then map the price IDs in the production admin.
3. In the Vercel production environment, set live keys, `APP_ENV=production`, `EMAIL_SENDING_ENABLED=true`, and `STRIPE_LIVE_MODE_APPROVAL=approved-by-owner`.
4. Connect the domain you choose. It is not purchased or invented by me.
5. Remove deployment protection only when you are ready for the public.
6. Make one real low risk purchase with your own card, then refund it.

Written approval: "I approve launching The BOSS Business System to the public on ____ ." Signed ________________.
