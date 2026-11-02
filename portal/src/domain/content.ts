export const CONTENT_STATUSES = ["draft", "review", "approved", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** D14 workflow: draft, review, approved, published, archived. Any state can return to draft; publishing requires approval first. */
export const ALLOWED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  draft: ["review"],
  review: ["draft", "approved"],
  approved: ["draft", "published"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export const TRANSITION_LABELS: Record<ContentStatus, string> = {
  draft: "Return to draft",
  review: "Send for review",
  approved: "Approve",
  published: "Publish",
  archived: "Archive",
};
