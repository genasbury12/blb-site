export const LIBRARY_KINDS = ["walkthrough", "tutorial", "automation_recipe", "ai_prompt", "template", "troubleshooting"] as const;
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
export const LIBRARY_KIND_LABELS: Record<LibraryKind, string> = {
  walkthrough: "Software walkthrough",
  tutorial: "Technical tutorial",
  automation_recipe: "Automation recipe",
  ai_prompt: "AI prompt",
  template: "Template",
  troubleshooting: "Troubleshooting",
};

/** Search term for a PostgREST ilike filter: trimmed, length limited, wildcard and filter syntax characters removed. */
export function sanitizeSearch(q: string | undefined | null): string | null {
  if (!q) return null;
  const clean = q.replace(/[%_\\,()*.:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return clean.length >= 2 ? clean : null;
}
