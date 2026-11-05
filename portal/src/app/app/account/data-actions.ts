"use server";

import { redirect } from "next/navigation";
import { deletionRequestedOwner } from "@/domain/email/templates";
import { publicEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";
import { sendEmail } from "@/lib/server/email";
import { errorState, type FormState } from "@/lib/server/form-result";
import { getSession } from "@/lib/server/session";

/** 10_DATA_RIGHTS Slice B: a member asks for their account and data to be deleted (typed DELETE to confirm). */
export async function requestDeletion(_prev: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("confirm") ?? "").trim() !== "DELETE") return errorState("Type DELETE in capital letters to confirm.");
  const session = await getSession();
  if (!session) return errorState("Your session ended. Sign in again.");
  const { supabase, user } = session;
  const before = await supabase.from("deletion_requests").select("id").eq("user_id", user.id).in("status", ["pending", "processing"]).maybeSingle();
  const { data, error } = await supabase.rpc("request_my_deletion").single();
  if (error || !data) {
    logEvent("error", "deletion request failed", { code: error?.code ?? null });
    return errorState("The request could not be saved. Please try again, or email us and we will take care of it.");
  }
  const row = data as { id: string; due_at: string };
  if (!before.data) {
    // Tell the owner once, with the member's name and the admin link (no other member data).
    const to = process.env.OWNER_NOTIFY_EMAIL || process.env.SUPPORT_CONTACT_EMAIL;
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
    const dueOn = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(row.due_at));
    if (to) await sendEmail(to, deletionRequestedOwner({ name: (profile?.display_name as string | null) ?? null, dueOn, url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/admin/students/deletions` }));
    logEvent("info", "deletion requested", { requestId: row.id });
  }
  redirect("/app/account?deletion=requested#your-data");
}

export async function cancelDeletion(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login?next=/app/account");
  const { error } = await session.supabase.rpc("cancel_my_deletion");
  if (error) logEvent("warn", "deletion cancel failed", { code: error.code ?? null });
  else logEvent("info", "deletion cancelled", {});
  redirect("/app/account?deletion=cancelled#your-data");
}
