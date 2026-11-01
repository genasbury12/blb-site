/** Route protection rules shared by the proxy and tests. */
export const PROTECTED_PREFIXES = ["/app", "/admin"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Only allow same-site relative redirects after sign in (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/app"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return isProtectedPath(next.split("?")[0]!) ? next : fallback;
}
