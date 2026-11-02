import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/admin/fields";
import { fmtShort } from "@/components/member/time";
import { PageHeader } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { listUsers, type DirectoryUser } from "@/lib/server/directory";
import { IntegrationNotConfigured } from "@/lib/server/integrations";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Students & access" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { supabase, isAdmin, user } = await requireStaff(["admin", "coach"], "/admin/students");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  if (!isAdmin) {
    // Coaches see only their assigned members (D09).
    const { data: assigned } = await supabase.from("coach_assignments").select("student_id").eq("coach_id", user.id);
    const ids = (assigned ?? []).map((a) => a.student_id as string);
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", ids) : { data: [] };
    return (
      <div>
        <PageHeader eyebrow="Students" title="Your members" lede="Members assigned to you by an admin." />
        <ul className="grid gap-3">{(profiles ?? []).map((p) => <li key={p.user_id as string}><Link className="font-semibold text-plum underline" href={`/admin/students/${p.user_id}`}>{(p.display_name as string) ?? "Member"}</Link></li>)}</ul>
        {!ids.length ? <p className="text-ink-muted">No members are assigned to you yet.</p> : null}
      </div>
    );
  }

  let users: DirectoryUser[] = [];
  let hasMore = false;
  let unavailable = false;
  try {
    ({ users, hasMore } = await listUsers(sp.q ?? null, page));
  } catch (err) {
    if (err instanceof IntegrationNotConfigured) unavailable = true;
    else throw err;
  }
  const ids = users.map((u) => u.id);
  const [profiles, grants] = await Promise.all([
    ids.length ? supabase.from("profiles").select("user_id, display_name").in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("orders").select("user_id, sku, status").in("user_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const nameOf = new Map((profiles.data ?? []).map((p) => [p.user_id as string, p.display_name as string]));
  const programs = new Map<string, string[]>();
  for (const o of grants.data ?? []) programs.set(o.user_id as string, [...(programs.get(o.user_id as string) ?? []), `${o.sku} (${String(o.status).replaceAll("_", " ")})`]);

  return (
    <div>
      <PageHeader eyebrow="Students" title="Students and access" lede="Look up any account, see what they can access and why, and adjust access with a written reason." />
      {unavailable ? <Alert tone="info">The account directory needs the Supabase server key in this environment.</Alert> : null}
      <form className="mb-6 flex flex-wrap gap-3" role="search">
        <label className="sr-only" htmlFor="q">Search by email</label>
        <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Search by email" className="min-h-11 flex-1 rounded-xl border border-mauve bg-white px-3" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <DataTable caption="Accounts" head={["Name", "Email", "Programs", "Joined", "Last sign in"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3"><Link className="font-medium hover:text-plum hover:underline" href={`/admin/students/${u.id}`}>{nameOf.get(u.id) ?? "No name"}</Link></td>
            <td className="px-4 py-3">{u.email}{u.confirmed ? "" : " (unconfirmed)"}</td>
            <td className="px-4 py-3 capitalize">{(programs.get(u.id) ?? []).join(", ") || "None"}</td>
            <td className="px-4 py-3">{fmtShort(u.created_at)}</td>
            <td className="px-4 py-3">{u.last_sign_in_at ? fmtShort(u.last_sign_in_at) : "Never"}</td>
          </tr>
        ))}
      </DataTable>
      <div className="mt-4 flex gap-4 text-sm">
        {page > 1 ? <Link className="text-plum underline" href={`/admin/students?page=${page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}>Previous</Link> : null}
        {hasMore ? <Link className="text-plum underline" href={`/admin/students?page=${page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`}>Next</Link> : null}
      </div>
    </div>
  );
}
