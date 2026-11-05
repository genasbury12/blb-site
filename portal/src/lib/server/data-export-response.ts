import "server-only";
import { NextResponse } from "next/server";
import { logEvent } from "@/lib/observability";
import type { UserSupabase } from "@/lib/supabase/server";
import { buildMemberExport } from "./data-export";

/**
 * Run one export for a route that has already checked who is asking. start_data_export (as the signed in caller)
 * enforces "self or admin" and the 10 minute limit; finish_data_export records the size in the audit log before the
 * file is handed over. If recording fails, nothing is handed over.
 */
/** exportedBy: for admin copies, the admin's name, written into the README and my-data.json (Slice D). */
export async function dataExportResponse(supabase: UserSupabase, userId: string, audience: "member" | "admin", exportedBy?: string) {
  const start = await supabase.rpc("start_data_export", { p_user: userId });
  if (start.error) {
    if (start.error.message.includes("rate_limited")) {
      const wait = Number(start.error.hint) || 600;
      return NextResponse.json({ error: "rate_limited", retry_after_seconds: wait }, { status: 429, headers: { "Retry-After": String(wait) } });
    }
    if (start.error.code === "42501" || start.error.code === "P0002") return NextResponse.json({ error: "not_found" }, { status: 404 });
    throw new Error(start.error.message);
  }
  const exportId = start.data as string;
  try {
    const { zip, filename } = await buildMemberExport(userId, audience, exportedBy);
    const done = await supabase.rpc("finish_data_export", { p_id: exportId, p_bytes: zip.byteLength });
    if (done.error) throw new Error(`export not recorded: ${done.error.code ?? "unknown"}`);
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zip.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    await supabase.rpc("finish_data_export", { p_id: exportId, p_bytes: null });
    logEvent("error", "data export failed", { message: err instanceof Error ? err.message.slice(0, 200) : "unknown" });
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
