import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getSession, requireSession } from "./session";

export type StaffRole = "admin" | "coach";

export const getStaffRoles = cache(async (): Promise<StaffRole[]> => {
  const session = await getSession();
  if (!session) return [];
  const { data } = await session.supabase.from("user_roles").select("role").eq("user_id", session.user.id);
  return (data ?? []).map((r: { role: StaffRole }) => r.role);
});

/** Pages: staff only. Non staff get a plain 404 so the admin area is not advertised. */
export async function requireStaff(allowed: StaffRole[] = ["admin"], nextPath = "/admin") {
  const session = await requireSession(nextPath);
  const roles = await getStaffRoles();
  if (!roles.some((r) => allowed.includes(r))) notFound();
  return { ...session, roles, isAdmin: roles.includes("admin") };
}

/** Server actions: throw instead of rendering. RLS still enforces every write. */
export async function authorizeStaff(allowed: StaffRole[] = ["admin"]) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  const roles = await getStaffRoles();
  if (!roles.some((r) => allowed.includes(r))) throw new Error("Not permitted");
  return { ...session, roles, isAdmin: roles.includes("admin") };
}
