import "server-only";
import type { Email } from "@/domain/email/templates";
import { appEnv, isEmailRecipientAllowed } from "@/lib/env";
import { logEvent } from "@/lib/observability";

/**
 * Resend transactional email (D16). Sends nothing unless EMAIL_SENDING_ENABLED=true, and outside
 * production only to EMAIL_TEST_ALLOWLIST addresses. Never throws into the calling action.
 */
export async function sendEmail(to: string, email: Email, fetchImpl: typeof fetch = fetch): Promise<"sent" | "suppressed" | "failed"> {
  const allowed = isEmailRecipientAllowed(to, {
    appEnv: appEnv(),
    sendingEnabled: process.env.EMAIL_SENDING_ENABLED === "true",
    allowlist: process.env.EMAIL_TEST_ALLOWLIST,
  });
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!allowed || !key || !from) {
    logEvent("info", "email suppressed", { subject: email.subject, reason: !allowed ? "not allowed in this environment" : "resend not configured" });
    return "suppressed";
  }
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: email.subject, text: email.text }),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}`);
    return "sent";
  } catch (err) {
    logEvent("error", "email failed", { subject: email.subject, error: err instanceof Error ? err.message : String(err) });
    return "failed";
  }
}
