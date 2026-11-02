import type { Metadata } from "next";
import { DataTable } from "@/components/admin/fields";
import { fmtShort } from "@/components/member/time";
import { PageHeader } from "@/components/shell/page-header";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { supabase } = await requireStaff(["admin"], "/admin/audit-log");
  const { type } = await searchParams;
  let q = supabase.from("admin_audit_log").select("id, actor_id, action, entity_type, entity_id, changed_fields, reason, created_at").order("id", { ascending: false }).limit(150);
  if (type && /^[a-z_]{3,40}$/.test(type)) q = q.eq("entity_type", type);
  const { data } = await q;
  const actors = [...new Set((data ?? []).map((r) => r.actor_id as string).filter(Boolean))];
  const { data: names } = actors.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", actors) : { data: [] };
  const nameOf = new Map((names ?? []).map((n) => [n.user_id as string, (n.display_name as string) ?? "Staff"]));
  return (
    <div>
      <PageHeader eyebrow="Audit log" title="Who changed what" lede="Append only. Entitlement changes, content edits, prices, roles, coaching, hours and billing decisions are recorded automatically." />
      <DataTable caption="Audit log" head={["When", "Who", "Action", "Item", "Details"]}>
        {(data ?? []).map((r) => (
          <tr key={r.id as number} className="align-top">
            <td className="whitespace-nowrap px-4 py-3">{fmtShort(r.created_at as string)}</td>
            <td className="px-4 py-3">{r.actor_id ? nameOf.get(r.actor_id as string) ?? "Staff" : "System"}</td>
            <td className="px-4 py-3 font-mono text-xs">{r.action as string}</td>
            <td className="px-4 py-3"><a className="text-plum underline" href={`/admin/audit-log?type=${r.entity_type}`}>{r.entity_type as string}</a></td>
            <td className="max-w-md px-4 py-3 text-xs">{r.reason ? <p className="mb-1 font-semibold">{r.reason as string}</p> : null}<code className="break-all">{JSON.stringify(r.changed_fields)}</code></td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
