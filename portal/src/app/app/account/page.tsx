import type { Metadata } from "next";
import { BillingNotices, formatDate } from "@/components/member/access-states";
import { DataExportButton } from "@/components/member/data-export-button";
import { ProfileForm } from "@/components/member/profile-form";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { loadGrants } from "@/lib/server/learning";
import { getBillingNotices, getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "My Account" };

const FEATURE_LABELS: Record<string, string> = {
  "curriculum.read": "Training modules",
  "audit.use": "Business audit",
  "library.read": "Implementation Library",
  "roadmap.use": "Roadmap",
  "group_coaching.access": "Weekly group coaching",
  "community.access": "Community",
  "feedback.submit": "Feedback submissions",
  "workshops.access": "Workshops",
  "hotseat.apply": "Monthly Hot Seat",
  "elite_coaching.access": "Weekly private coaching",
  "elite_board.access": "Private Elite workspace",
  "elite_dfu_hours.use": "Done for you implementation hours",
};

const PRODUCT_LABELS: Record<string, string> = {
  blueprint: "BOSS Blueprint",
  accelerator: "BOSS Accelerator",
  elite: "BOSS Elite",
};

const PLAN_LABELS: Record<string, string> = { pay_in_full: "Paid in full", six_installments: "Six payments" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  installments_current: "Payments up to date",
  installments_past_due: "Payment past due",
  installments_completed: "All six payments complete",
  canceled: "Canceled",
  refunded: "Refunded",
  disputed: "Under review",
  expired: "Checkout expired",
};

export default async function AccountPage() {
  const { supabase, user } = await requireSession("/app/account");
  const [features, notices, profile, grants, orders] = await Promise.all([
    getFeatures(),
    getBillingNotices(),
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    loadGrants(supabase, user.id),
    supabase.from("orders").select("id, sku, payment_plan, status, installments_paid, installments_total, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  // Latest end date per feature among grants, showing whether each is currently active.
  const byFeature = new Map<string, { ends: string | null; active: boolean }>();
  for (const g of grants) {
    const prev = byFeature.get(g.feature_key);
    const ends = g.ends_at;
    const later = !prev || (prev.ends !== null && (ends === null || ends > prev.ends));
    if (later) byFeature.set(g.feature_key, { ends, active: features.has(g.feature_key as never) });
  }
  const support = process.env.SUPPORT_CONTACT_EMAIL;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="My Account" title="Your account" />
      <BillingNotices notices={notices} />

      <Card>
        <CardTitle className="text-xl">Profile</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">Signed in as {user.email}</p>
        <div className="mt-4 max-w-sm">
          <ProfileForm displayName={(profile.data?.display_name as string | undefined) ?? ""} />
        </div>
      </Card>

      <Card>
        <CardTitle className="text-xl">Your access</CardTitle>
        {byFeature.size === 0 ? (
          <p className="mt-2 text-ink-muted">There is no program access on this account yet. If you purchased with a different email, sign in with that email.</p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Access by feature with end dates</caption>
            <thead>
              <tr className="border-b border-rose">
                <th scope="col" className="py-2 pr-4">Included</th>
                <th scope="col" className="py-2 pr-4">Status</th>
                <th scope="col" className="py-2">Through</th>
              </tr>
            </thead>
            <tbody>
              {[...byFeature.entries()].map(([key, v]) => (
                <tr key={key} className="border-b border-rose-soft">
                  <td className="py-2 pr-4">{FEATURE_LABELS[key] ?? key}</td>
                  <td className="py-2 pr-4">{v.active ? "Active" : "Not active"}</td>
                  <td className="py-2">{v.ends ? formatDate(v.ends) : "Ongoing"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardTitle className="text-xl">Purchases</CardTitle>
        {orders.data?.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {orders.data.map((o) => (
              <li key={o.id as string}>
                {PRODUCT_LABELS[o.sku as string] ?? (o.sku as string)}, {PLAN_LABELS[o.payment_plan as string] ?? (o.payment_plan as string)}:{" "}
                {STATUS_LABELS[o.status as string] ?? (o.status as string)}
                {o.payment_plan === "six_installments" ? ` (${o.installments_paid} of ${o.installments_total} payments)` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-muted">No purchases on this account yet.</p>
        )}
        <p className="mt-4 text-sm text-ink-muted">Payment methods and invoices will be managed here once online payments are connected.</p>
      </Card>

      <section aria-labelledby="your-data">
        <Card>
          <CardTitle id="your-data" className="text-xl">Your data</CardTitle>
          <p className="mt-2 max-w-prose text-sm">
            Download a copy of everything the portal stores about you: your profile, purchases and access dates, your business audit, progress and milestones, every worksheet answer with a PDF of each completed worksheet, and anything you submitted or posted. It comes as one ZIP file.
          </p>
          <div className="mt-4">
            <DataExportButton endpoint="/api/account/export" label="Download all my data" />
          </div>
          <p className="mt-3 text-xs text-ink-muted">You can download once every 10 minutes. Each download is recorded, without its contents. This stays available for 12 months after your program access ends.</p>
        </Card>
      </section>

      {support ? (
        <Card>
          <CardTitle className="text-xl">Need help?</CardTitle>
          <p className="mt-2 text-sm">
            Email <a className="text-plum underline" href={`mailto:${support}`}>{support}</a>. Support replies on Tuesdays and Thursdays.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
