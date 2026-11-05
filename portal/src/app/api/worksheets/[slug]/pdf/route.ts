import { NextResponse } from "next/server";
import { renderWorksheetPdf, worksheetPdfFilename } from "@/lib/pdf/worksheet-pdf";
import { logEvent } from "@/lib/observability";
import { getSession } from "@/lib/server/session";
import { loadWorksheetPdfContext, memberDisplayName } from "@/lib/server/worksheets";

const SLUG = /^[a-z0-9-]{3,80}$/;

/** The signed in member's own worksheet as a branded PDF. RLS limits every read to their own answers. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!SLUG.test(slug)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const c = await loadWorksheetPdfContext(session.supabase, session.user.id, slug);
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const pdf = await renderWorksheetPdf({
    schema: c.worksheet.schema,
    answers: c.worksheet.answers,
    moduleNumber: c.moduleNumber,
    lessonNumber: c.lessonNumber,
    memberName: await memberDisplayName(session.supabase, session.user.id),
    completedAt: c.worksheet.completedAt,
    callbacks: c.worksheet.callbacks,
    topCallbacks: c.worksheet.topCallbacks,
  });
  logEvent("info", "worksheet pdf downloaded", { slug });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${worksheetPdfFilename(c.moduleNumber, c.lessonNumber)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
