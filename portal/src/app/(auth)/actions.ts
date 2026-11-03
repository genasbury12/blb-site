"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";
import { landingPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fieldErrors, forgotSchema, resetSchema, signInSchema, signUpSchema, type ActionResult } from "@/lib/validation/auth";

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  error: "Sign in is not available in this environment yet because authentication has not been configured.",
};

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error || !data.user) {
    // One message for every failure so the form does not reveal which accounts exist.
    return { ok: false, error: "That email and password did not work, or the email has not been confirmed yet." };
  }
  // Staff land in the admin workspace unless they were heading somewhere specific. Only chooses the landing
  // page; /admin still authorizes on the server and in RLS.
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  redirect(landingPath(parsed.data.next, (roles ?? []).length > 0));
}

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const site = publicEnv().NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${site}/auth/confirm?next=/app`,
    },
  });
  if (error && error.status !== 422) {
    logEvent("warn", "signup failed", { status: error.status, code: error.code });
    return { ok: false, error: "We could not create your account right now. Please try again in a few minutes." };
  }
  return { ok: true, message: "Check your email for a confirmation link. You can sign in after you confirm." };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const site = publicEnv().NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${site}/auth/confirm` });
  if (error) logEvent("warn", "password reset request failed", { status: error.status, code: error.code });
  // Same response whether or not the account exists.
  return { ok: true, message: "If an account uses that email, a reset link is on its way. The link expires soon, so use it today." };
}

export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "We could not update your password. Request a new reset link and try again." };
  redirect("/app");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
