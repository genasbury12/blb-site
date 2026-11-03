import { NextResponse } from "next/server";
import { worksheetCsv, worksheetCsvFilename } from "@/domain/worksheets/admin";
import { logEvent } from "@/lib/observability";
import { getSession } from "@/lib/server/session";
import { getStaffRoles } from "@/lib/server/staff";
import { loadStaffResponses, loadStaffWorksheet } from "@/lib/server/worksheets-admin";

const SLUG = /^[a-z0-9-]{3,80}$/;

/**
 * Every response to one worksheet as CSV (Slice D). Admins only: coaches get the same 404 as everyone else (the
 * brief allows coach export only if the decisions register says so; it does not). Each export is audited.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const roles = await getStaffRoles();
  if (!roles.includes("admin") || !SLUG.test(slug)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const worksheet = await loadStaffWorksheet(session.supabase, slug);
  if (!worksheet) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const rows = await loadStaffResponses(session.supabase, slug, { isAdmin: true });
  // Record the export before handing over the file; if the audit write fails, nothing is exported.
  const { error } = await session.supabase.rpc("admin_log_worksheet_export", { p_slug: slug, p_rows: rows.length });
  if (error) {
    logEvent("error", "worksheet csv export not audited", { slug, code: error.code ?? null });
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
  logEvent("info", "worksheet csv exported", { slug, rows: rows.length });
  return new NextResponse(worksheetCsv(worksheet.schema, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${worksheetCsvFilename(slug)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
