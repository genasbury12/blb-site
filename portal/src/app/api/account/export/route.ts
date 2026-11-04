import { NextResponse } from "next/server";
import { dataExportResponse } from "@/lib/server/data-export-response";
import { getSession } from "@/lib/server/session";

// Several PDFs and uploaded files can take a while: allow up to a minute.
export const maxDuration = 60;

/** 10_DATA_RIGHTS Slice A: the signed in member's own "Download all my data" ZIP. Works after access ends. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return dataExportResponse(session.supabase, session.user.id, "member");
}
