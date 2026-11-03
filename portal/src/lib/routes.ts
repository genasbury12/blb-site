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

/**
 * Where to go after sign in (I-43, owner decision 2026-11-03): an explicit destination wins; otherwise staff
 * (admin or coach) land in the admin workspace and members on their dashboard.
 */
export function landingPath(next: string | null | undefined, isStaff: boolean): string {
  const target = safeNextPath(next);
  return isStaff && target === "/app" ? "/admin" : target;
}
