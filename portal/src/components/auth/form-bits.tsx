"use client";

import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label } from "@/components/ui/field";
import type { ComponentProps } from "react";

export function TextField({
  id,
  label,
  error,
  hint,
  ...props
}: { id: string; label: string; error?: string; hint?: string } & ComponentProps<"input">) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FormMessage({ result }: { result: { ok: boolean; message?: string; error?: string } | null }) {
  if (!result) return null;
  if (result.ok) return result.message ? <Alert tone="success">{result.message}</Alert> : null;
  return <Alert tone="danger">{result.error}</Alert>;
}
