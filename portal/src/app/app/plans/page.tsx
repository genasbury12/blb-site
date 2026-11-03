import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { startCheckout } from "@/app/app/billing/actions";
import { ActionForm } from "@/components/admin/action-form";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Card, Eyebrow } from "@/components/ui/card";
import { dollars, eligibility, findOffer, offerTotalCents, type Sku } from "@/domain/billing/offers";
import { isFeatureEnabled } from "@/lib/env";
import { loadPurchaseHistory } from "@/lib/server/billing";
import { requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Plans" };

/** Inclusions summarize the approved tier table (blueprint section 5). Copy is provisional (COPY_REVIEW.md). */
const TIERS: { sku: Sku; name: string; tagline: string; includes: string[]; featured?: boolean }[] = [
  {
    sku: "blueprint",
    name: "BOSS Blueprint",
    tagline: "Learn the system and implement it on your own.",
    includes: ["All eight modules for 12 months", "Business audit, roadmap and dashboard", "Implementation Library and AI templates"],
  },
  {
    sku: "accelerator",
    name: "BOSS Accelerator",
    tagline: "Build it with weekly guidance and feedback.",
    featured: true,
    includes: ["Everything in Blueprint", "Six months of weekly group coaching", "Community, two new workshops a month, monthly Hot Seat", "Two feedback submissions each monthly cycle"],
  },
  {
    sku: "elite",
    name: "BOSS Elite",
    tagline: "Private guidance and hands on implementation.",
    includes: ["Everything in Accelerator", "Weekly private 60 minute coaching for six months", "Coach led audit, custom roadmap and private workspace", "12 hours of done for you technical implementation"],
  },
];

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { supabase, user } = await requireSession("/app/plans");
  const sp = await searchParams;
  const history = await loadPurchaseHistory(supabase, user.id);
  const now = new Date();
  const billingOpen = isFeatureEnabled("billing");

  return (
    <div>
      <PageHeader eyebrow="Plans" title="Choose your level of support" lede="One system, three levels of support. Six payment plans are a fixed commitment of six monthly payments, and billing stops after the sixth." />
      {sp.checkout === "canceled" ? <Alert tone="info" className="mb-6">Checkout was canceled. Nothing was charged.</Alert> : null}
      {!billingOpen ? <Alert tone="info" title="Online enrollment is not open yet" className="mb-8">Plans are shown for review. Checkout turns on when payments are approved.</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((t) => {
          const pif = findOffer(t.sku, "pay_in_full")!;
          const six = findOffer(t.sku, "six_installments")!;
          const elig = eligibility(pif, history, now);
          return (
            <Card key={t.sku} tone={t.featured ? "feature" : "plain"} className="flex flex-col">
              <Eyebrow>{t.featured ? "Most guidance for most members" : "Program"}</Eyebrow>
              <h2 className="mt-2 font-display text-[1.9rem] font-medium">{t.name}</h2>
              <p className="mt-1 text-sm text-ink-muted">{t.tagline}</p>
              <p className="numeral mt-5 text-[3rem] leading-none">{dollars(pif.amountCents)}</p>
              <p className="mt-1 text-sm text-ink-muted">or six payments of {dollars(six.amountCents)} ({dollars(offerTotalCents(six))} total)</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {t.includes.map((i) => (
                  <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-plum" aria-hidden />{i}</li>
                ))}
              </ul>
              <div className="mt-6 space-y-2">
                {t.sku === "elite" && !history.eliteAccepted ? (
                  <Link href="/apply/elite" className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-plum px-6 font-semibold text-white hover:bg-plum-deep">Apply for Elite</Link>
                ) : !elig.allowed ? (
                  <p className="rounded-xl bg-rose-soft/60 p-3 text-sm">{elig.reason}</p>
                ) : billingOpen ? (
                  <>
                    <ActionForm action={startCheckout} submitLabel={`Pay ${dollars(pif.amountCents)} in full`} pendingLabel="Opening secure checkout" className="[&_button]:w-full">
                      <input type="hidden" name="sku" value={t.sku} />
                      <input type="hidden" name="plan" value="pay_in_full" />
                    </ActionForm>
                    <ActionForm action={startCheckout} submitLabel={`Six payments of ${dollars(six.amountCents)}`} pendingLabel="Opening secure checkout" variant="secondary" className="[&_button]:w-full">
                      <input type="hidden" name="sku" value={t.sku} />
                      <input type="hidden" name="plan" value="six_installments" />
                    </ActionForm>
                  </>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      <section aria-labelledby="after" className="mt-14">
        <SectionTitle id="after">After your coaching period</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {(["graduate_coaching", "elite_board"] as const).map((sku) => {
            const offer = findOffer(sku, "monthly")!;
            const elig = eligibility(offer, history, now);
            return (
              <Card key={sku}>
                <h3 className="font-display text-2xl">{offer.name}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {sku === "graduate_coaching"
                    ? "Weekly group coaching, community, new workshops, Hot Seat and replays. Keeps your training open while active. No private feedback, 1:1 or done for you work."
                    : "Keeps your Elite board, your training open for new lessons, and new workshops. No 1:1 coaching or done for you work."}
                </p>
                <p className="numeral mt-4 text-[2.4rem] leading-none">{dollars(offer.amountCents)}<span className="font-sans text-base text-ink-muted"> / month</span></p>
                <p className="mt-1 text-sm text-ink-muted">Cancel anytime. Access continues through the paid period.</p>
                <div className="mt-5">
                  {!elig.allowed ? (
                    <p className="rounded-xl bg-rose-soft/60 p-3 text-sm">{elig.reason}</p>
                  ) : billingOpen ? (
                    <ActionForm action={startCheckout} submitLabel={elig.trialEnd ? "Join now, billing starts when coaching ends" : "Join"} pendingLabel="Opening secure checkout" variant="secondary">
                      <input type="hidden" name="sku" value={sku} />
                      <input type="hidden" name="plan" value="monthly" />
                    </ActionForm>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
      <p className="mt-10 text-sm text-ink-muted">
        Prices in USD. Refund terms are in the <Link className="underline" href="/refund-policy">refund policy</Link>, which is pending legal approval.
      </p>
    </div>
  );
}
