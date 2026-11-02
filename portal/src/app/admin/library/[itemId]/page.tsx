import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveLibraryItem } from "@/app/admin/catalog/actions";
import { ActionForm } from "@/components/admin/action-form";
import { LibraryFields, type LibraryDefaults } from "@/components/admin/library-fields";
import { StatusControls } from "@/components/admin/status-controls";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import type { ContentStatus } from "@/domain/content";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Library item" };

export default async function AdminLibraryItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const { supabase } = await requireStaff(["admin"], `/admin/library/${itemId}`);
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) notFound();
  const { data } = await supabase.from("library_items").select("*").eq("id", itemId).maybeSingle();
  if (!data) notFound();
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Library item" title={data.title as string} actions={<Link className="text-sm font-semibold text-plum underline" href="/admin/library">All items</Link>} />
      <Card><StatusControls id={itemId} table="library_items" status={data.status as ContentStatus} canEdit /></Card>
      <Card>
        <ActionForm action={saveLibraryItem} submitLabel="Save item">
          <input type="hidden" name="id" value={itemId} />
          <LibraryFields d={data as LibraryDefaults} />
        </ActionForm>
      </Card>
    </div>
  );
}
