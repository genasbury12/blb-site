/** Entitlement feature keys (handoff 03). Mirrors the Postgres enum public.feature_key. */
export const FEATURE_KEYS = [
  "curriculum.read",
  "audit.use",
  "library.read",
  "roadmap.use",
  "group_coaching.access",
  "community.access",
  "feedback.submit",
  "workshops.access",
  "hotseat.apply",
  "elite_coaching.access",
  "elite_board.access",
  "elite_dfu_hours.use",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export function isFeatureKey(v: unknown): v is FeatureKey {
  return typeof v === "string" && (FEATURE_KEYS as readonly string[]).includes(v);
}

export type NavItem = { href: string; label: string; feature: FeatureKey | null; flag?: "coaching" | "community" | "feedback" | "elite" };

/**
 * Member navigation (Phase 2 Student Experience: main navigation). Items appear only when the
 * member holds the feature AND the section is built and enabled. Hidden links are never the
 * security boundary; every page and action checks again on the server and in RLS.
 */
export const MEMBER_NAV: NavItem[] = [
  { href: "/app", label: "My Dashboard", feature: null },
  { href: "/app/training", label: "My Training", feature: "curriculum.read" },
  { href: "/app/audit", label: "My Business Audit", feature: "audit.use" },
  { href: "/app/roadmap", label: "My Roadmap", feature: "roadmap.use" },
  { href: "/app/coaching", label: "Coaching & Community", feature: "group_coaching.access", flag: "coaching" },
  { href: "/app/feedback", label: "Feedback", feature: "feedback.submit", flag: "feedback" },
  { href: "/app/elite", label: "My Elite Workspace", feature: "elite_board.access", flag: "elite" },
  { href: "/app/account", label: "My Account", feature: null },
];

export function visibleNav(features: ReadonlySet<FeatureKey>, flags: Partial<Record<NonNullable<NavItem["flag"]>, boolean>>): NavItem[] {
  return MEMBER_NAV.filter((item) => (item.feature === null || features.has(item.feature)) && (!item.flag || flags[item.flag] === true));
}
