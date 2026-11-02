import type { Metadata } from "next";
import Link from "next/link";
import { saveWorkshop } from "@/app/admin/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable, StatusPill } from "@/components/admin/fields";
import { WorkshopFields } from "@/components/admin/workshop-fields";
import { fmtDay } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { utcToEasternWall, workshopReleaseDates, zonedParts } from "@/domain/schedule/calendar";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Workshops" };

export default async function AdminWorkshopsPage() {
  const { supabase } = await requireStaff(["admin"], "/admin/workshops");
  const { data } = await supabase.from("workshops").select("id, title, release_at, status, captions_ready, video_provider_id").order("release_at", { ascending: false });
  const now = new Date();
  const p = zonedParts(now);
  const upcoming = [0, 1].flatMap((o) => workshopReleaseDates(new Date(Date.UTC(p.year, p.monthIndex + o, 1)).getUTCFullYear(), new Date(Date.UTC(p.year, p.monthIndex + o, 1)).getUTCMonth())).filter((d) => d > now);
  const suggested = upcoming[0] ? utcToEasternWall(upcoming[0]) : undefined;
  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Workshops" title="Workshop library" lede={`Next release dates: ${upcoming.slice(0, 3).map((d) => fmtDay(d)).join(", ")}. A workshop appears to coaching members once it is published and its release time has passed.`} />
      <DataTable caption="Workshops" head={["Title", "Release", "Status", "Video"]}>
        {(data ?? []).map((w) => (
          <tr key={w.id as string}>
            <td className="px-4 py-3"><Link className="font-medium hover:text-plum hover:underline" href={`/admin/workshops/${w.id}`}>{w.title as string}</Link></td>
            <td className="px-4 py-3">{fmtDay(w.release_at as string)}</td>
            <td className="px-4 py-3"><StatusPill status={w.status as string} /></td>
            <td className="px-4 py-3">{w.video_provider_id ? (w.captions_ready ? "Ready" : "Captions missing") : "None"}</td>
          </tr>
        ))}
      </DataTable>
      <section aria-labelledby="new"><SectionTitle id="new">Add a workshop</SectionTitle><Card><ActionForm action={saveWorkshop} submitLabel="Create draft workshop"><WorkshopFields d={{}} suggested={suggested} /></ActionForm></Card></section>
    </div>
  );
}
