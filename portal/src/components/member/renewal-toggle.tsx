import { setMembershipRenewal } from "@/app/app/billing/actions";
import { ActionForm } from "@/components/admin/action-form";

export function RenewalToggle({ id, cancelAtPeriodEnd }: { id: string; cancelAtPeriodEnd: boolean }) {
  return (
    <ActionForm action={setMembershipRenewal} submitLabel={cancelAtPeriodEnd ? "Keep my membership" : "Cancel at period end"} variant="secondary" className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="cancel" value={cancelAtPeriodEnd ? "false" : "true"} />
    </ActionForm>
  );
}
