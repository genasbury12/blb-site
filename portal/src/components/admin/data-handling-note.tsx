"use client";

import { usePathname } from "next/navigation";

/** Admin screens that show member data (10_DATA_RIGHTS Slice D). Curriculum, library and workshop screens do not. */
const MEMBER_DATA_PATHS = ["/admin/students", "/admin/worksheets", "/admin/feedback", "/admin/coaching", "/admin/community", "/admin/elite", "/admin/billing", "/admin/audit-log", "/admin/settings/data"];

export function DataHandlingNote() {
  const path = usePathname() ?? "";
  if (!MEMBER_DATA_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return (
    <p className="mt-16 border-t border-rose-soft pt-4 text-xs text-ink-muted" data-testid="data-handling-note">
      <span className="font-semibold">Data handling:</span> Member answers are private. Exports are logged.
    </p>
  );
}
