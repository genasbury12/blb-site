import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveWorkshop } from "@/app/admin/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { StatusControls } from "@/components/admin/status-controls";
import { WorkshopFields, type WorkshopDefaults } from "@/components/admin/workshop-fields";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import type { ContentStatus } from "@/domain/content";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Workshop" };

export default async function AdminWorkshopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff(["admin"], `/admin/workshops/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase.from("workshops").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Workshop" title={data.title as string} actions={<Link className="text-sm font-semibold text-plum underline" href="/admin/workshops">All workshops</Link>} />
      <Card><StatusControls id={id} table="workshops" status={data.status as ContentStatus} canEdit /></Card>
      <Card><ActionForm action={saveWorkshop} submitLabel="Save workshop"><WorkshopFields d={data as WorkshopDefaults} /></ActionForm></Card>
    </div>
  );
}
