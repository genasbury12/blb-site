import { NextResponse } from "next/server";
import { renderModuleWorksheetsPdf, worksheetPdfFilename } from "@/lib/pdf/worksheet-pdf";
import { logEvent } from "@/lib/observability";
import { getSession } from "@/lib/server/session";
import { loadModuleWorksheetPdfContexts, memberDisplayName } from "@/lib/server/worksheets";

const SLUG = /^[a-z0-9-]{3,60}$/;

/** All of the member's completed worksheets in a module, in lesson order, as one PDF. */
export async function GET(_req: Request, ctx: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!SLUG.test(moduleSlug)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const m = await loadModuleWorksheetPdfContexts(session.supabase, session.user.id, moduleSlug);
  if (!m) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!m.items.length) return NextResponse.json({ error: "no_completed_worksheets", message: "Complete a worksheet in this module first." }, { status: 404 });
  const name = await memberDisplayName(session.supabase, session.user.id);
  const pdf = await renderModuleWorksheetsPdf(
    m.items.map((c) => ({ schema: c.worksheet.schema, answers: c.worksheet.answers, moduleNumber: c.moduleNumber, lessonNumber: c.lessonNumber, memberName: name, completedAt: c.worksheet.completedAt, callbacks: c.worksheet.callbacks })),
    m.moduleNumber,
  );
  logEvent("info", "module worksheets pdf downloaded", { module: moduleSlug, count: m.items.length });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${worksheetPdfFilename(m.moduleNumber)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
