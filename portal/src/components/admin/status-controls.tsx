import { changeStatus } from "@/app/admin/catalog/actions";
import { ALLOWED_TRANSITIONS, TRANSITION_LABELS, type ContentStatus } from "@/domain/content";
import { ActionForm } from "./action-form";
import { StatusPill } from "./fields";

export function StatusControls({ id, table, status, canEdit }: { id: string; table: "lessons" | "modules" | "library_items" | "milestones" | "workshops"; status: ContentStatus; canEdit: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-ink-muted">Status</span>
      <StatusPill status={status} />
      {canEdit
        ? ALLOWED_TRANSITIONS[status].map((to) => (
            <ActionForm key={to} action={changeStatus} submitLabel={TRANSITION_LABELS[to]} variant={to === "published" ? "primary" : "secondary"} className="flex items-center gap-2">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="to" value={to} />
            </ActionForm>
          ))
        : null}
    </div>
  );
}
