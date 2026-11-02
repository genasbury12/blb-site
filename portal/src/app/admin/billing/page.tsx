import type { Metadata } from "next";
import { resolveBillingException, setStripePriceId } from "@/app/admin/billing/actions";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable, TextInput } from "@/components/admin/fields";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { dollars } from "@/domain/billing/offers";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Payments" };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }) : "");
const PLAN: Record<string, string> = { pay_in_full: "Pay in full", six_installments: "Six payments", monthly: "Monthly" };

export default async function AdminBillingPage() {
  const { supabase } = await requireStaff(["admin"], "/admin/billing");
  const [prices, exceptions, orders, events] = await Promise.all([
    supabase.from("prices").select("id, sku, plan, amount_cents, stripe_price_id").order("sku").order("plan"),
    supabase.from("billing_exceptions").select("id, kind, detail, stripe_object_id, created_at, order_id").is("resolved_at", null).order("created_at", { ascending: false }),
    supabase.from("orders").select("id, sku, payment_plan, status, installments_paid, installments_total, past_due_since, created_at, email").order("created_at", { ascending: false }).limit(25),
    supabase.from("billing_events").select("stripe_event_id, type, received_at, processed_at, outcome, error").order("received_at", { ascending: false }).limit(20),
  ]);
  const live = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Payments" title="Billing and exceptions" lede="Prices are approved in code (D04). Here you connect each one to its Stripe price, review situations that need a person, and watch payment events." />
      <Alert tone={live ? "warning" : "info"} title={live ? "Live Stripe key detected" : "Stripe test mode"}>
        {live ? "Live charging requires STRIPE_LIVE_MODE_APPROVAL=approved-by-owner; otherwise every request is refused." : "Use Stripe test cards only. No real money moves."}
      </Alert>

      <section aria-labelledby="exceptions">
        <SectionTitle id="exceptions">Needs review ({exceptions.data?.length ?? 0})</SectionTitle>
        {(exceptions.data ?? []).length === 0 ? (
          <Card tone="quiet"><p className="text-ink-muted">Nothing needs review.</p></Card>
        ) : (
          <div className="grid gap-4">
            {(exceptions.data ?? []).map((x) => (
              <Card key={x.id as string}>
                <p className="font-semibold">{String(x.kind).replaceAll("_", " ")}</p>
                <p className="text-sm text-ink-muted">{fmt(x.created_at as string)} · {x.stripe_object_id as string}</p>
                <pre className="mt-2 overflow-auto rounded-xl bg-ivory p-3 text-xs">{JSON.stringify(x.detail, null, 2)}</pre>
                <ActionForm action={resolveBillingException} submitLabel="Mark resolved" variant="secondary" className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <input type="hidden" name="id" value={x.id as string} />
                  <label className="text-sm font-semibold">What did you do?<TextInput name="note" required minLength={5} /></label>
                </ActionForm>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="prices">
        <SectionTitle id="prices">Stripe prices for this environment</SectionTitle>
        <p className="mb-4 text-sm text-ink-muted">Create each product in Stripe with the exact amount shown (six payment prices are monthly recurring prices), then paste its price ID here.</p>
        <div className="grid gap-3">
          {(prices.data ?? []).map((p) => (
            <Card key={p.id as string} className="p-5">
              <ActionForm action={setStripePriceId} submitLabel="Save" variant="secondary" className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                <input type="hidden" name="id" value={p.id as string} />
                <div>
                  <p className="font-semibold capitalize">{String(p.sku).replace("_", " ")}</p>
                  <p className="text-sm text-ink-muted">{PLAN[p.plan as string]}: {dollars(p.amount_cents as number)}{p.plan === "monthly" || p.plan === "six_installments" ? " per month" : ""}</p>
                </div>
                <label className="text-sm font-semibold">Stripe price ID<TextInput name="stripe_price_id" defaultValue={(p.stripe_price_id as string) ?? ""} placeholder="price_..." /></label>
              </ActionForm>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="orders">
        <SectionTitle id="orders">Recent orders</SectionTitle>
        <DataTable caption="Recent orders" head={["Created", "Program", "Plan", "Status", "Payments", "Past due since"]}>
          {(orders.data ?? []).map((o) => (
            <tr key={o.id as string}>
              <td className="px-4 py-3">{fmt(o.created_at as string)}</td>
              <td className="px-4 py-3 capitalize">{o.sku as string}</td>
              <td className="px-4 py-3">{PLAN[o.payment_plan as string]}</td>
              <td className="px-4 py-3">{String(o.status).replaceAll("_", " ")}</td>
              <td className="px-4 py-3">{o.installments_paid as number} of {o.installments_total as number}</td>
              <td className="px-4 py-3">{fmt(o.past_due_since as string | null)}</td>
            </tr>
          ))}
        </DataTable>
      </section>

      <section aria-labelledby="events">
        <SectionTitle id="events">Payment events</SectionTitle>
        <DataTable caption="Stripe webhook events" head={["Received", "Type", "Outcome", "Error"]}>
          {(events.data ?? []).map((e) => (
            <tr key={e.stripe_event_id as string}>
              <td className="px-4 py-3">{fmt(e.received_at as string)}</td>
              <td className="px-4 py-3 font-mono text-xs">{e.type as string}</td>
              <td className="px-4 py-3">{e.processed_at ? (e.outcome as string) : "Waiting for retry"}</td>
              <td className="px-4 py-3 text-danger">{(e.error as string) ?? ""}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>
  );
}
