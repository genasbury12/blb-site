import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDataRightsJob } from "@/lib/server/data-rights-job";
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
 * 10_DATA_RIGHTS daily job (Vercel Cron, see vercel.json): retention reminders and deletions, members' requests past
 * 30 days, and purchase records past 7 years. Vercel sends "Authorization: Bearer CRON_SECRET". Responds with counts.
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const summary = await runDataRightsJob();
    return NextResponse.json(summary, { status: summary.status === "ok" ? 200 : 500 });
  } catch (err) {
    logEvent("error", "data rights job could not start", { message: err instanceof Error ? err.message.slice(0, 200) : "unknown" });
    return NextResponse.json({ error: "job_failed" }, { status: 500 });
  }
}
