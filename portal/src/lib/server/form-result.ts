export type FormState = { ok: boolean; message?: string; error?: string; at?: number } | null;

export const okState = (message: string): FormState => ({ ok: true, message, at: Date.now() });
export const errorState = (error: string): FormState => ({ ok: false, error, at: Date.now() });

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
