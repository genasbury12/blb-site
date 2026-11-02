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

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  /** Any one of these grants the item. Empty means every signed in member. */
  features: FeatureKey[];
  flag?: "coaching" | "community" | "feedback" | "elite";
};

/**
 * Member navigation (Phase 2 Student Experience: main navigation). Items appear only when the
 * member holds the feature AND the section is built and enabled. Hidden links are never the
 * security boundary; every page and action checks again on the server and in RLS.
 */
export const MEMBER_NAV: NavItem[] = [
  { href: "/app", label: "My Dashboard", icon: "dashboard", features: [] },
  { href: "/app/training", label: "My Training", icon: "training", features: ["curriculum.read"] },
  { href: "/app/library", label: "Implementation Library", icon: "library", features: ["library.read"] },
  { href: "/app/audit", label: "My Business Audit", icon: "audit", features: ["audit.use"] },
  { href: "/app/roadmap", label: "My Roadmap", icon: "roadmap", features: ["roadmap.use"] },
  { href: "/app/coaching", label: "Coaching", icon: "coaching", features: ["group_coaching.access"], flag: "coaching" },
  { href: "/app/workshops", label: "Workshops", icon: "workshops", features: ["workshops.access"], flag: "coaching" },
  { href: "/app/community", label: "Community", icon: "community", features: ["community.access"], flag: "community" },
  { href: "/app/feedback", label: "Feedback", icon: "feedback", features: ["feedback.submit"], flag: "feedback" },
  { href: "/app/elite", label: "My Elite Workspace", icon: "elite", features: ["elite_board.access", "elite_dfu_hours.use"], flag: "elite" },
  { href: "/app/account", label: "My Account", icon: "account", features: [] },
];

export function visibleNav(features: ReadonlySet<FeatureKey>, flags: Partial<Record<NonNullable<NavItem["flag"]>, boolean>>): NavItem[] {
  return MEMBER_NAV.filter(
    (item) => (item.features.length === 0 || item.features.some((f) => features.has(f))) && (!item.flag || flags[item.flag] === true),
  );
}
