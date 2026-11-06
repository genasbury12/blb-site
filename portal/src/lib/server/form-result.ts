/**
 * Result of an admin form action. On a failed save, `values` carries what was submitted so the form can be filled in
 * again (React resets a form after its action runs, which would otherwise wipe every field).
 */
export type FormValues = Record<string, string[]>;
export type FormState = { ok: boolean; message?: string; error?: string; at?: number; values?: FormValues } | null;

export const okState = (message: string): FormState => ({ ok: true, message, at: Date.now() });
export const errorState = (error: string, values?: FormValues): FormState => ({ ok: false, error, at: Date.now(), ...(values ? { values } : {}) });

/** The submitted text values, by field name (repeated names keep every value). Files and Next's own keys are left out. */
export function formValues(fd: FormData): FormValues {
  const out: FormValues = {};
  for (const [name, value] of fd.entries()) {
    if (typeof value !== "string" || name.startsWith("$ACTION")) continue;
    (out[name] ??= []).push(value);
  }
  return out;
}

/** Which unique constraint a Postgres "duplicate key" error names, if any. */
export function duplicateConstraint(message: string): string | null {
  if (!/duplicate key/i.test(message)) return null;
  return message.match(/unique constraint "([^"]+)"/i)?.[1] ?? null;
}

export function errorMessage(err: unknown, fallback = "Something went wrong. Nothing was changed."): string {
  if (err instanceof Error) {
    if (err.message === "Not signed in") return "Your session ended. Sign in again.";
    if (err.message === "Not permitted") return "Your role does not allow this.";
    if (/violates row-level security|permission denied/i.test(err.message)) return "Your role does not allow this.";
    if (/Captions are required|transcript is required|Sample lessons cannot|reviewed migration|seat|quota|deadline|closed|allowance|minutes/i.test(err.message)) return err.message;
    if (/duplicate key/i.test(err.message)) return "Something with that name or slug already exists.";
  }
  return fallback;
}
