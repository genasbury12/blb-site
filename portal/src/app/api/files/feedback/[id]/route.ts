import { NextResponse } from "next/server";
import { IntegrationNotConfigured } from "@/lib/server/integrations";
import { getSession } from "@/lib/server/session";
import { signedDownloadUrl } from "@/lib/server/storage";

/** Feedback attachment. RLS returns the row only to its owner, an admin, or the assigned coach. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await session.supabase.from("feedback_submissions").select("file_key").eq("id", id).maybeSingle();
  if (!data?.file_key) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const url = await signedDownloadUrl("feedback-files", data.file_key as string);
    return NextResponse.redirect(url, { status: 303, headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof IntegrationNotConfigured) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
    throw err;
  }
}
