import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Card, Stat } from "@/components/ui/card";
import { integrationStatus } from "@/lib/server/integrations";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Overview" };

const SERVICES: { key: keyof ReturnType<typeof integrationStatus>; label: string }[] = [
  { key: "supabase", label: "Supabase (accounts and data)" },
  { key: "serviceRole", label: "Supabase server key (uploads, scoring, billing)" },
  { key: "stripe", label: "Stripe test mode (payments)" },
  { key: "mux", label: "Mux (lesson video)" },
  { key: "resend", label: "Resend (email)" },
  { key: "sentry", label: "Sentry (error reports)" },
];

export default async function AdminOverview() {
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], "/admin");
  const [students, published, inReview, suggestions] = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("lessons").select("id", { count: "exact", head: true }).in("status", ["review", "approved"]),
    supabase.from("content_suggestions").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const status = integrationStatus();
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin workspace" title="Good to see you" lede="Everything you need to run the program, without touching code." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Accounts" value={String(students.count ?? 0)} /></Card>
        <Card><Stat label="Published lessons" value={String(published.count ?? 0)} /></Card>
        <Card><Stat label="Lessons awaiting review" value={String(inReview.count ?? 0)} hint={inReview.count ? undefined : "Nothing waiting"} /></Card>
        <Card><Stat label="Open edit suggestions" value={String(suggestions.count ?? 0)} /></Card>
      </div>
      {isAdmin ? (
        <section aria-labelledby="services">
          <SectionTitle id="services">Connected services</SectionTitle>
          <Card>
            <ul className="divide-y divide-rose-soft">
              {SERVICES.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-4 py-3">
                  <span>{s.label}</span>
                  <span className={status[s.key] ? "font-semibold text-success" : "font-semibold text-ink-muted"}>{status[s.key] ? "Connected" : "Not connected"}</span>
                </li>
              ))}
            </ul>
            {!status.stripe ? (
              <Alert tone="info" className="mt-4">Payments run in Stripe test mode only. Live charging stays off until you approve it.</Alert>
            ) : null}
          </Card>
        </section>
      ) : null}
      <p className="text-sm text-ink-muted">
        Start with <Link className="font-semibold text-plum underline" href="/admin/catalog">Curriculum</Link> or <Link className="font-semibold text-plum underline" href="/admin/students">Students &amp; access</Link>.
      </p>
    </div>
  );
}
