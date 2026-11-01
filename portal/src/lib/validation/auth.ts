import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

/** Mirrors supabase/config.toml: at least 10 characters with lower, upper case letters and digits. */
export const newPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your first name.").max(80),
  email: emailSchema,
  password: newPasswordSchema,
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: newPasswordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
