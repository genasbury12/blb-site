import type { Metadata } from "next";
import Link from "next/link";
import { decideApplication } from "@/app/admin/elite/actions";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable, Field, TextInput } from "@/components/admin/fields";
import { fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, Stat } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Elite clients" };
const STATUS: Record<string, string> = { submitted: "New", reviewing: "Reviewing", discovery_scheduled: "Discovery call scheduled", accepted: "Accepted, awaiting enrollment", declined: "Declined", withdrawn: "Withdrawn", enrolled: "Enrolled" };

export default async function AdminElitePage() {
  const { supabase } = await requireStaff(["admin", "coach"], "/admin/elite");
  const [cap, apps, boards] = await Promise.all([
    supabase.rpc("elite_capacity"),
    supabase.from("elite_applications").select("*").not("status", "in", "(enrolled,withdrawn)").order("created_at"),
    supabase.from("elite_boards").select("id, client_id, coach_id, created_at").order("created_at", { ascending: false }),
  ]);
  const capacity = (cap.data as { seats_total: number; seats_used: number }[] | null)?.[0] ?? { seats_total: 5, seats_used: 0 };
  const people = [...new Set((boards.data ?? []).flatMap((b) => [b.client_id as string, b.coach_id as string]).filter(Boolean))];
  const { data: profiles } = people.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", people) : { data: [] };
  const name = new Map((profiles ?? []).map((p) => [p.user_id as string, (p.display_name as string) ?? "Member"]));
  const hours = await Promise.all((boards.data ?? []).map(async (b) => ((await supabase.rpc("elite_hours_summary", { p_board: b.id })).data ?? []) as { minutes_granted: number; minutes_used: number; expires_at: string }[]));

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Elite" title="Elite clients" lede="Application, discovery call, acceptance, then checkout. Accepting holds a seat for 14 days. The cap of five includes accepted offers." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><Stat label="Seats in use" value={`${capacity.seats_used} of ${capacity.seats_total}`} /></Card>
        <Card><Stat label="Applications to review" value={String((apps.data ?? []).filter((a) => ["submitted", "reviewing", "discovery_scheduled"].includes(a.status as string)).length)} /></Card>
        <Card><Stat label="Workspaces" value={String(boards.data?.length ?? 0)} /></Card>
      </div>

      <section aria-labelledby="apps">
        <SectionTitle id="apps">Applications</SectionTitle>
        {(apps.data ?? []).length === 0 ? <Card tone="quiet"><p className="text-ink-muted">No open applications.</p></Card> : null}
        <div className="grid gap-4">
          {(apps.data ?? []).map((a) => (
            <Card key={a.id as string}>
              <div className="flex flex-wrap items-center gap-3"><h3 className="font-display text-2xl">{a.name as string}</h3><Badge tone={a.status === "accepted" ? "plum" : "neutral"}>{STATUS[a.status as string]}</Badge></div>
              <p className="text-sm text-ink-muted">{a.email as string} · Applied {fmtShort(a.created_at as string)}{a.business_url ? <> · <a className="underline" href={a.business_url as string} target="_blank" rel="noopener noreferrer">website</a></> : null}{a.hours_per_week != null ? ` · ${a.hours_per_week} hours a week` : ""}</p>
              <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <div><dt className="font-semibold">Business today</dt><dd className="whitespace-pre-line">{a.business_stage as string}</dd></div>
                <div><dt className="font-semibold">Six month goals</dt><dd className="whitespace-pre-line">{a.goals as string}</dd></div>
                <div><dt className="font-semibold">Biggest challenge</dt><dd className="whitespace-pre-line">{a.biggest_challenge as string}</dd></div>
              </dl>
              {a.discovery_at ? <p className="mt-2 text-sm">Discovery call: {fmtShort(a.discovery_at as string)} Eastern</p> : null}
              {a.status === "accepted" && a.accepted_until ? <p className="mt-2 text-sm">Offer held until {fmtShort(a.accepted_until as string)}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3 border-t border-rose-soft pt-4">
                <ActionForm action={decideApplication} submitLabel="Schedule discovery call" variant="secondary" className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={a.id as string} /><input type="hidden" name="status" value="discovery_scheduled" />
                  <Field label="Call time (Eastern)" htmlFor={`dc-${a.id}`}><TextInput id={`dc-${a.id}`} name="discovery_at" type="datetime-local" /></Field>
                </ActionForm>
                <ActionForm action={decideApplication} submitLabel="Accept" className="flex items-end"><input type="hidden" name="id" value={a.id as string} /><input type="hidden" name="status" value="accepted" /></ActionForm>
                <ActionForm action={decideApplication} submitLabel="Decline" variant="secondary" className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={a.id as string} /><input type="hidden" name="status" value="declined" />
                  <TextInput name="note" placeholder="Internal note (optional)" className="min-h-9 w-56 text-sm" />
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="clients">
        <SectionTitle id="clients">Client workspaces</SectionTitle>
        <DataTable caption="Elite client workspaces" head={["Client", "Coach", "Included hours left", "Since"]}>
          {(boards.data ?? []).map((b, i) => {
            const inc = hours[i]?.find((h) => h) ?? null;
            const left = hours[i]?.reduce((s, h) => s + Math.max(0, h.minutes_granted - h.minutes_used), 0) ?? 0;
            return (
              <tr key={b.id as string}>
                <td className="px-4 py-3"><Link className="font-medium hover:text-plum hover:underline" href={`/admin/elite/${b.id}`}>{name.get(b.client_id as string) ?? "Client"}</Link></td>
                <td className="px-4 py-3">{b.coach_id ? name.get(b.coach_id as string) ?? "Coach" : "Unassigned"}</td>
                <td className="px-4 py-3">{inc ? `${Math.floor(left / 60)}h ${left % 60}m` : "None"}</td>
                <td className="px-4 py-3">{fmtShort(b.created_at as string)}</td>
              </tr>
            );
          })}
        </DataTable>
      </section>
    </div>
  );
}
