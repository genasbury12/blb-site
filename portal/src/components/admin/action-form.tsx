"use client";

import { useActionState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/server/form-result";

/** Server action form with pending state and an announced result. Works without client validation libs. */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving",
  variant = "primary",
  className = "space-y-4",
  encType,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children?: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
  encType?: "multipart/form-data";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className} encType={encType}>
      {children}
      <div aria-live="polite">
        {state ? <Alert tone={state.ok ? "success" : "danger"}>{state.ok ? state.message : state.error}</Alert> : null}
      </div>
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
