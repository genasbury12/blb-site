import { NextResponse } from "next/server";
import { safeDownloadName } from "@/domain/files";
import { logEvent } from "@/lib/observability";
import { IntegrationNotConfigured } from "@/lib/server/integrations";
import { getSession } from "@/lib/server/session";
import { signedDownloadUrl } from "@/lib/server/storage";

/**
 * Lesson download. Authorization is the member's own RLS query: the row is returned only when the
 * resource is published, its lesson and module are published, and the member holds curriculum access
 * (staff can preview unpublished files). Only then is a 5 minute signed link issued (D15).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await session.supabase.from("lesson_resources").select("storage_key, label, mime_type, file_name").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const ext = String(data.storage_key).split(".").pop() ?? "pdf";
    const url = await signedDownloadUrl("lesson-resources", data.storage_key as string, safeDownloadName(data.label as string, ext));
    logEvent("info", "resource_download", { resource: id });
    return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof IntegrationNotConfigured) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
    throw err;
  }
}
