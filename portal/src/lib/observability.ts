/**
 * PII scrubbing for error reports and logs (D03, D15, D17).
 * Never send audit answers, feedback, emails, tokens, or student content to third parties.
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const STRIPE_SECRET_RE = /\b(sk|rk|whsec)_(test|live)?_?[A-Za-z0-9]{8,}\b/g;
const CARD_RE = /\b(?:\d[ -]?){13,19}\b/g;

const SENSITIVE_KEYS = new Set([
  "password",
  "email",
  "answers",
  "answers_json",
  "answers_snapshot_json",
  "content",
  "response_text",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "set-cookie",
  "meeting_url_private",
  "recording_url_private",
]);

export function scrubString(input: string): string {
  return input
    .replace(JWT_RE, "[redacted-jwt]")
    .replace(STRIPE_SECRET_RE, "[redacted-secret]")
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(CARD_RE, "[redacted-number]");
}

export function scrub<T>(value: T, depth = 0): T {
  if (depth > 8) return "[truncated]" as unknown as T;
  if (typeof value === "string") return scrubString(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? "[redacted]" : scrub(v, depth + 1);
    }
    return out as T;
  }
  return value;
}

/** Structured server log line with scrubbing. */
export function logEvent(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({ level, message: scrubString(message), ...(data ? { data: scrub(data) } : {}) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
