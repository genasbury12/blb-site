import type { Metadata } from "next";
import Link from "next/link";
import { saveLibraryItem } from "@/app/admin/catalog/actions";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable, StatusPill } from "@/components/admin/fields";
import { LibraryFields } from "@/components/admin/library-fields";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { LIBRARY_KIND_LABELS, type LibraryKind } from "@/domain/library";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Library" };

export default async function AdminLibraryPage() {
  const { supabase } = await requireStaff(["admin"], "/admin/library");
  const { data } = await supabase.from("library_items").select("id, title, kind, module_number, status").order("updated_at", { ascending: false });
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Implementation Library" title="Library items" lede="Items follow the same draft, review, approved, published workflow as lessons." />
      <DataTable caption="Library items" head={["Title", "Type", "Module", "Status"]}>
        {(data ?? []).map((i) => (
          <tr key={i.id as string}>
            <td className="px-4 py-3"><Link className="font-medium hover:text-plum hover:underline" href={`/admin/library/${i.id}`}>{i.title as string}</Link></td>
            <td className="px-4 py-3">{LIBRARY_KIND_LABELS[i.kind as LibraryKind]}</td>
            <td className="px-4 py-3">{i.module_number ? `Module ${i.module_number}` : "None"}</td>
            <td className="px-4 py-3"><StatusPill status={i.status as string} /></td>
          </tr>
        ))}
      </DataTable>
      <section aria-labelledby="new-item">
        <SectionTitle id="new-item">Add an item</SectionTitle>
        <Card>
          <ActionForm action={saveLibraryItem} submitLabel="Create draft item"><LibraryFields d={{}} /></ActionForm>
        </Card>
      </section>
    </div>
  );
}
