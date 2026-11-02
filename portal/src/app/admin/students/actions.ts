"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FEATURE_KEYS } from "@/lib/features";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { authorizeStaff } from "@/lib/server/staff";

export async function grantAccess(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ user_id: z.string().uuid(), feature: z.enum(FEATURE_KEYS), ends_on: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/), reason: z.string().trim().min(5, "A reason of at least 5 characters is required.").max(500) })
    .safeParse({ user_id: fd.get("user_id"), feature: fd.get("feature"), ends_on: fd.get("ends_on") ?? "", reason: fd.get("reason") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.rpc("admin_grant_entitlement", {
      p_user: parsed.data.user_id,
      p_feature: parsed.data.feature,
      p_starts_at: new Date().toISOString(),
      p_ends_at: parsed.data.ends_on ? new Date(`${parsed.data.ends_on}T23:59:59-05:00`).toISOString() : null,
      p_reason: parsed.data.reason,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/students/${parsed.data.user_id}`);
  return okState("Access granted and recorded in the audit log.");
}

export async function setGrantState(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), user_id: z.string().uuid(), state: z.enum(["active", "suspended", "revoked"]), reason: z.string().trim().min(5, "A reason is required.").max(500) }).safeParse({ id: fd.get("id"), user_id: fd.get("user_id"), state: fd.get("state"), reason: fd.get("reason") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.rpc("admin_set_entitlement_state", { p_entitlement: parsed.data.id, p_state: parsed.data.state, p_reason: parsed.data.reason });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/students/${parsed.data.user_id}`);
  return okState(`Access ${parsed.data.state}. Logged.`);
}

export async function setCoachRole(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ user_id: z.string().uuid(), enabled: z.enum(["true", "false"]), reason: z.string().trim().min(5, "A reason is required.").max(500) }).safeParse({ user_id: fd.get("user_id"), enabled: fd.get("enabled"), reason: fd.get("reason") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.rpc("admin_set_coach_role", { p_user: parsed.data.user_id, p_enabled: parsed.data.enabled === "true", p_reason: parsed.data.reason });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/students/${parsed.data.user_id}`);
  return okState("Role updated.");
}

export async function assignStudentCoach(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ student_id: z.string().uuid(), coach_id: z.string().uuid(), remove: z.enum(["true", "false"]) }).safeParse({ student_id: fd.get("student_id"), coach_id: fd.get("coach_id"), remove: fd.get("remove") ?? "false" });
  if (!parsed.success) return errorState("Choose a coach.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const r = parsed.data.remove === "true"
      ? await supabase.from("coach_assignments").delete().eq("coach_id", parsed.data.coach_id).eq("student_id", parsed.data.student_id)
      : await supabase.from("coach_assignments").upsert({ coach_id: parsed.data.coach_id, student_id: parsed.data.student_id }, { onConflict: "coach_id,student_id", ignoreDuplicates: true });
    if (r.error) throw new Error(r.error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/students/${parsed.data.student_id}`);
  return okState("Coach assignment updated.");
}
