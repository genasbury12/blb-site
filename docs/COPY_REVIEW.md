# Provisional copy register (I-09)

All student and admin facing text written during the build is **provisional** until the owner approves it. It follows `docs/voice.md` (no em or en dashes, no emojis, no income or results claims), enforced by `npm run check:copy`. Approve, edit, or replace each area before launch.

| Area | Where it lives | Notes |
|---|---|---|
| Audit section intros | `portal/src/domain/audit/v1.ts` (`SECTION_INTROS`) | Question text itself is canonical Phase 2 wording and is not provisional |
| Audit path reasons, priority titles and reasons, lowest category reasons, roadmap item text, explanations | `portal/src/domain/audit/score.ts` | Explanations state results are self reported and not a revenue prediction |
| Dashboard next actions and access summary | `portal/src/app/app/page.tsx` | |
| Audit intro and review text | `portal/src/app/app/audit/page.tsx`, `portal/src/components/audit/audit-stepper.tsx` | |
| Report headings and path chooser text | `portal/src/components/audit/audit-report.tsx`, `portal/src/components/audit/path-chooser.tsx` | |
| PDF report text | `portal/src/lib/pdf/audit-report-pdf.tsx` | |
| Lesson page states, AI prompt guidance | `portal/src/app/app/training/**` | "Review and test anything AI writes" follows FINAL_05 |
| Library page text | `portal/src/app/app/library/**` | |
| Billing, grace, suspension, and no access notices | `portal/src/components/member/access-states.tsx`, `portal/src/app/app/account/page.tsx` | Legal billing language needs legal review (D07, D08) |
| Auth pages and messages | `portal/src/app/(auth)/**`, `portal/src/components/auth/**` | |
| Home page | `portal/src/app/page.tsx` | |
| Coaching, workshops, Hot Seat, feedback, community, Elite, checkout | Added in later milestones; listed in BUILD_STATUS | Refund and payment wording requires legal approval (D08) |
