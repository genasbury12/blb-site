import { NextResponse } from "next/server";
import { dataExportResponse } from "@/lib/server/data-export-response";
import { getSession } from "@/lib/server/session";
import { getStaffRoles } from "@/lib/server/staff";

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 10_DATA_RIGHTS Slice A: an admin exports one member's data (same ZIP). Admins only; coaches get a 404. */
export async function POST(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await getStaffRoles()).includes("admin") || !UUID.test(userId)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return dataExportResponse(session.supabase, userId);
}
