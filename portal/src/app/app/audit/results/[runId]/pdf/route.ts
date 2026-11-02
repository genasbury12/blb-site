import { NextResponse } from "next/server";
import { renderAuditReportPdf } from "@/lib/pdf/audit-report-pdf";
import { loadRun } from "@/lib/server/audit";
import { getSession } from "@/lib/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Private PDF of one audit run. RLS limits loadRun to the owner (or an assigned coach or admin). */
export async function GET(_req: Request, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!UUID.test(runId)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const run = await loadRun(session.supabase, runId);
  if (!run) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const profile = await session.supabase.from("profiles").select("display_name").eq("user_id", session.user.id).maybeSingle();
  const pdf = await renderAuditReportPdf(run, (profile.data?.display_name as string | null) ?? null);
  const date = run.submitted_at.slice(0, 10);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BOSS-Business-Audit-${date}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
