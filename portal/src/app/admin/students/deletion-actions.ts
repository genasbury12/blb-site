"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { executeDeletion } from "@/lib/server/data-deletion";
import { getUserEmail } from "@/lib/server/directory";
import { errorState, okState, type FormState } from "@/lib/server/form-result";
import { logEvent } from "@/lib/observability";
import { authorizeStaff } from "@/lib/server/staff";

const schema = z.object({ id: z.string().uuid(), email: z.string().trim().min(3).max(320) });

/** 10_DATA_RIGHTS Slice B: an admin deletes a pending request now. The member's email must be typed to confirm. */
export async function deleteNow(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = schema.safeParse({ id: fd.get("id"), email: fd.get("email") });
  if (!parsed.success) return errorState("Type the member's email to confirm.");
  let admin;
  try {
    admin = await authorizeStaff(["admin"]);
  } catch {
    return errorState("Your role does not allow this.");
  }
  const { data: req } = await admin.supabase.from("deletion_requests").select("id, user_id, status").eq("id", parsed.data.id).maybeSingle();
  if (!req || !["pending", "processing"].includes(req.status as string)) return errorState("This request is no longer open.");
  const email = req.user_id ? await getUserEmail(req.user_id as string) : null;
  if (req.user_id && (!email || email.toLowerCase() !== parsed.data.email.toLowerCase())) return errorState("That email does not match this member. Nothing was deleted.");
  let outcome: "deleted" | "anonymized";
  try {
    outcome = (await executeDeletion(parsed.data.id, admin.user.id)).outcome;
  } catch (err) {
    logEvent("error", "admin deletion failed", { requestId: parsed.data.id, message: err instanceof Error ? err.message.slice(0, 200) : "unknown" });
    revalidatePath("/admin/students/deletions");
    return errorState("The deletion did not finish. It is safe to try again; the daily job will also retry it.");
  }
  // The request leaves the pending list, so the result is shown at the top of the page.
  revalidatePath("/admin/students/deletions");
  redirect(`/admin/students/deletions?done=${outcome}`);
}

const recordSchema = z.object({ userId: z.string().uuid(), confirm: z.literal("on") });

/** Owner decision 2026-11-04: an admin records a deletion request the member made another way (for example by email). */
export async function recordDeletionRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = recordSchema.safeParse({ userId: fd.get("userId"), confirm: fd.get("confirm") });
  if (!parsed.success) return errorState("Tick the box to confirm the member asked for this.");
  let admin;
  try {
    admin = await authorizeStaff(["admin"]);
  } catch {
    return errorState("Your role does not allow this.");
  }
  const { data, error } = await admin.supabase.rpc("admin_record_deletion", { p_user: parsed.data.userId }).single();
  if (error || !data) {
    if (error?.message.includes("use My Account")) return errorState("This is your own account. Use My Account to delete it.");
    logEvent("error", "record deletion failed", { code: error?.code ?? null });
    return errorState("The request could not be recorded. Nothing was changed.");
  }
  logEvent("info", "deletion recorded by admin", { requestId: (data as { id: string }).id });
  revalidatePath(`/admin/students/${parsed.data.userId}`);
  revalidatePath("/admin/students/deletions");
  return okState("Recorded. It is on Deletion requests and follows the same rules as a request from the member.");
}
