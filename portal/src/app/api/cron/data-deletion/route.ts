import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { dueDeletionRequests, executeDeletion } from "@/lib/server/data-deletion";
import { logEvent } from "@/lib/observability";

// Each deletion talks to the database, storage and auth: allow time for several.
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  return Boolean(secret) && given.length === want.length && timingSafeEqual(Buffer.from(given), Buffer.from(want));
}

/**
 * 10_DATA_RIGHTS Slice B daily job (Vercel Cron, see vercel.json): deletes every request still pending 30 days after
 * it was made, and finishes any left half done. Vercel sends "Authorization: Bearer CRON_SECRET".
 * Responds with counts only.
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ids = await dueDeletionRequests();
  let deleted = 0;
  let anonymized = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      const r = await executeDeletion(id, null);
      if (r.outcome === "deleted") deleted += 1;
      else anonymized += 1;
    } catch (err) {
      failed += 1;
      logEvent("error", "scheduled deletion failed", { requestId: id, message: err instanceof Error ? err.message.slice(0, 200) : "unknown" });
    }
  }
  logEvent("info", "deletion job ran", { due: ids.length, deleted, anonymized, failed });
  return NextResponse.json({ due: ids.length, deleted, anonymized, failed }, { status: failed ? 500 : 200 });
}
