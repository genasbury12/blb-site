import type { Metadata } from "next";
import Link from "next/link";
import { openBillingPortal } from "@/app/app/billing/actions";
import { BillingNotices, formatDate } from "@/components/member/access-states";
import { RenewalToggle } from "@/components/member/renewal-toggle";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { dollars } from "@/domain/billing/offers";
import { getBillingNotices, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Billing" };

const NAMES: Record<string, string> = { blueprint: "BOSS Blueprint", accelerator: "BOSS Accelerator", elite: "BOSS Elite", graduate_coaching: "Graduate Coaching Membership", elite_board: "Elite Board Retention" };
const ORDER_STATUS: Record<string, string> = {
  pending: "Waiting for payment confirmation",
  paid: "Paid in full",
  installments_current: "Payments up to date",
  installments_past_due: "A payment is past due",
  installments_completed: "All six payments complete",
  canceled: "Canceled",
  refunded: "Refunded",
  disputed: "Under review",
  expired: "Checkout not completed",
};
const SUB_STATUS: Record<string, string> = { active: "Active", trialing: "Starts billing later", past_due: "Payment past due", canceled: "Ended", incomplete: "Incomplete", unpaid: "Unpaid" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; portal?: string }> }) {
  const { supabase, user } = await requireSession("/app/billing");
  const sp = await searchParams;
  const [notices, orders, subs, customer] = await Promise.all([
    getBillingNotices(),
    supabase.from("orders").select("id, sku, payment_plan, status, amount_cents, installments_paid, installments_total, first_paid_at, created_at").eq("user_id", user.id).neq("status", "expired").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("id, sku, status, current_period_end, cancel_at_period_end").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("stripe_customers").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Billing" title="Payments and memberships" actions={<Link className="self-center font-semibold text-plum underline underline-offset-4" href="/app/plans">See plans</Link>} />
      {sp.checkout === "success" ? (
        <Alert tone="success" title="Thank you. We are confirming your payment.">Your access appears as soon as Stripe confirms the payment, usually within a minute. Refresh this page if it has not appeared yet.</Alert>
      ) : null}
      {sp.portal === "unavailable" ? <Alert tone="info">Payment management is not available yet for this account.</Alert> : null}
      <BillingNotices notices={notices} />

      <section aria-labelledby="programs">
        <SectionTitle id="programs">Programs</SectionTitle>
        {(orders.data ?? []).length === 0 ? (
          <Card tone="quiet"><p className="text-ink-muted">No program purchases on this account yet.</p></Card>
        ) : (
          <div className="grid gap-4">
            {(orders.data ?? []).map((o) => (
              <Card key={o.id as string}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Eyebrow>{o.payment_plan === "six_installments" ? "Six payment plan" : "Paid in full"}</Eyebrow>
                    <h3 className="mt-1 font-display text-2xl">{NAMES[o.sku as string]}</h3>
                    <p className="mt-1 text-sm">{ORDER_STATUS[o.status as string] ?? (o.status as string)}</p>
                  </div>
                  <p className="numeral text-3xl">{dollars(o.amount_cents as number)}{o.payment_plan === "six_installments" ? <span className="font-sans text-sm text-ink-muted"> x 6</span> : null}</p>
                </div>
                {o.payment_plan === "six_installments" ? (
                  <div className="mt-4 max-w-md">
                    <ProgressBar value={((o.installments_paid as number) / (o.installments_total as number)) * 100} label={`${o.installments_paid} of ${o.installments_total} payments made`} />
                  </div>
                ) : null}
                {o.first_paid_at ? <p className="mt-3 text-sm text-ink-muted">Started {formatDate(o.first_paid_at as string)}</p> : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="memberships">
        <SectionTitle id="memberships">Memberships</SectionTitle>
        {(subs.data ?? []).length === 0 ? (
          <Card tone="quiet"><p className="text-ink-muted">No memberships.</p></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(subs.data ?? []).map((s) => (
              <Card key={s.id as string}>
                <h3 className="font-display text-2xl">{NAMES[s.sku as string]}</h3>
                <p className="mt-1 text-sm">{SUB_STATUS[s.status as string] ?? (s.status as string)}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {s.cancel_at_period_end || s.status === "canceled" ? "Access ends" : "Renews"} {formatDate(s.current_period_end as string)}
                </p>
                {s.status !== "canceled" ? <div className="mt-4"><RenewalToggle id={s.id as string} cancelAtPeriodEnd={Boolean(s.cancel_at_period_end)} /></div> : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      {customer.data ? (
        <Card tone="quiet">
          <h3 className="font-display text-xl">Payment method and invoices</h3>
          <p className="mt-1 text-sm text-ink-muted">Opens a secure Stripe page. Six payment plans cannot be canceled there; they end after the sixth payment.</p>
          <form action={openBillingPortal} className="mt-4">
            <Button type="submit" variant="secondary">Manage payment method</Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
