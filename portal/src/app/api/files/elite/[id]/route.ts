import { NextResponse } from "next/server";
import { IntegrationNotConfigured } from "@/lib/server/integrations";
import { getSession } from "@/lib/server/session";
import { signedDownloadUrl } from "@/lib/server/storage";

/** Elite file. RLS returns the row only to the board's client (in the right mode), its coach, or an admin. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await session.supabase.from("elite_files").select("storage_key").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    return NextResponse.redirect(await signedDownloadUrl("elite-files", data.storage_key as string), { status: 303, headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof IntegrationNotConfigured) return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
    throw err;
  }
}
