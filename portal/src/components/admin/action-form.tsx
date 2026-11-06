"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FormState, FormValues } from "@/lib/server/form-result";

/**
 * Puts submitted values back after a failed save. React resets a form once its action has run, which clears every
 * field; when the action returns the values it was sent, this fills them in again. Hidden inputs keep their own
 * values and file inputs cannot be set, so both are left alone.
 */
function refill(form: HTMLFormElement, values: FormValues) {
  for (const el of Array.from(form.elements)) {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) || !el.name) continue;
    const sent = values[el.name];
    if (el instanceof HTMLInputElement) {
      if (el.type === "hidden" || el.type === "file" || el.type === "submit") continue;
      // An unchecked box is not submitted at all, so a missing name means unchecked.
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = Boolean(sent?.includes(el.value));
        continue;
      }
    }
    if (el instanceof HTMLSelectElement && el.multiple) {
      for (const o of Array.from(el.options)) o.selected = Boolean(sent?.includes(o.value));
      continue;
    }
    if (sent) el.value = sent[0] ?? "";
    // A controlled select (the worksheet and lesson pickers) learns its value back through its change handler.
    if (el instanceof HTMLSelectElement) el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

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
  const formRef = useRef<HTMLFormElement>(null);
  // Runs after the commit in which React reset the form, so the refilled values stay.
  useEffect(() => {
    if (state && !state.ok && state.values && formRef.current) refill(formRef.current, state.values);
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className={className} encType={encType}>
      {children}
      <div aria-live="polite" data-testid="form-status">
        {state ? <Alert tone={state.ok ? "success" : "danger"}>{state.ok ? state.message : state.error}</Alert> : null}
      </div>
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
