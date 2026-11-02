"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isFeatureEnabled } from "@/lib/env";
import { logEvent } from "@/lib/observability";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { authorize } from "@/lib/server/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const applicationSchema = z.object({
  name: z.string().trim().min(2, "Add your name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  business_url: z.string().trim().max(300).refine((v) => v === "" || /^https?:\/\//.test(v), "Start the link with https://"),
  business_stage: z.string().trim().min(2, "Tell us where your business is today.").max(500),
  goals: z.string().trim().min(10, "Share what you want to build in six months.").max(3000),
  biggest_challenge: z.string().trim().min(10, "Share your biggest challenge.").max(3000),
  hours_per_week: z.string().trim().regex(/^\d{0,2}$/),
  website: z.literal(""), // honeypot: real people leave this empty
});

/** Public Elite application (application, discovery, acceptance, then checkout). */
export async function submitEliteApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!isFeatureEnabled("elite")) return errorState("Elite applications are not open yet.");
  const parsed = applicationSchema.safeParse(Object.fromEntries(["name", "email", "business_url", "business_stage", "goals", "biggest_challenge", "hours_per_week", "website"].map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return errorState("Applications are not open in this environment yet.");
    const { website, ...p } = parsed.data;
    void website;
    const { error } = await supabase.rpc("submit_elite_application", { p });
    if (error) throw new Error(error.message);
    logEvent("info", "elite_application_submitted");
  } catch (err) {
    return errorState(err instanceof Error && /already being reviewed|paused/.test(err.message) ? err.message : errorMessage(err));
  }
  redirect("/apply/elite/confirmation");
}

const BOARD = z.string().uuid();

export async function addRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ board_id: BOARD, title: z.string().trim().min(2, "Name the request.").max(200), body: z.string().trim().min(10, "Describe what you need done.").max(4000) }).safeParse({ board_id: fd.get("board_id"), title: fd.get("title"), body: fd.get("body") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the request.");
  try {
    const { supabase, user } = await authorize(null);
    const { error } = await supabase.from("elite_items").insert({ ...parsed.data, kind: "request", status: "submitted", created_by: user.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/elite");
  return okState("Request sent. Your coach scopes it and adds an estimated timeline.");
}

export async function addTask(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ board_id: BOARD, title: z.string().trim().min(2).max(200), due_on: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/) }).safeParse({ board_id: fd.get("board_id"), title: fd.get("title"), due_on: fd.get("due_on") ?? "" });
  if (!parsed.success) return errorState("Add a task name.");
  try {
    const { supabase, user } = await authorize("elite_board.access");
    const { error } = await supabase.from("elite_items").insert({ board_id: parsed.data.board_id, title: parsed.data.title, due_on: parsed.data.due_on || null, kind: "task", status: "open", created_by: user.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/elite");
  return okState("Task added.");
}

export async function setTaskDone(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), done: z.enum(["true", "false"]) }).safeParse({ id: fd.get("id"), done: fd.get("done") });
  if (!parsed.success) return errorState("Invalid task.");
  try {
    const { supabase } = await authorize("elite_board.access");
    const { data, error } = await supabase.from("elite_items").update({ status: parsed.data.done === "true" ? "done" : "open" }).eq("id", parsed.data.id).eq("kind", "task").select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) return errorState("Your coach manages that item.");
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/elite");
  return okState("Updated.");
}

export async function submitCheckin(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({
      board_id: BOARD,
      session_id: z.string().uuid(),
      accomplishments: z.string().trim().min(3, "Share what you accomplished.").max(4000),
      challenges: z.string().trim().min(3, "Share what got in the way.").max(4000),
      top_priorities: z.string().trim().min(3, "List next week's top three priorities.").max(2000),
      help_needed: z.string().trim().min(3, "Tell your coach where you need help.").max(4000),
    })
    .safeParse(Object.fromEntries(["board_id", "session_id", "accomplishments", "challenges", "top_priorities", "help_needed"].map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Complete all four questions.");
  try {
    const { supabase } = await authorize("elite_board.access");
    const { error } = await supabase.from("elite_checkins").upsert(parsed.data, { onConflict: "session_id" });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/elite");
  return okState("Check-in saved. Your coach reads it before your session.");
}

export async function cancelPrivateSession(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return errorState("Invalid session.");
  try {
    const { supabase } = await authorize("elite_coaching.access");
    const { data, error } = await supabase.rpc("client_cancel_private_session", { p_id: id.data });
    if (error) throw new Error(error.message);
    revalidatePath("/app/elite");
    return data === "client_rescheduled"
      ? okState("Canceled with enough notice. Your coach will offer a new time.")
      : okState("Canceled with less than 24 hours notice, so this session is forfeited under the scheduling policy.");
  } catch (err) {
    return errorState(errorMessage(err));
  }
}

export async function commentOnItem(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ item_id: z.string().uuid(), body: z.string().trim().min(1).max(4000) }).safeParse({ item_id: fd.get("item_id"), body: fd.get("body") });
  if (!parsed.success) return errorState("Write a comment.");
  try {
    const { supabase, user } = await authorize(null);
    const { error } = await supabase.from("elite_item_comments").insert({ ...parsed.data, user_id: user.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/elite");
  revalidatePath("/admin/elite", "layout");
  return okState("Comment added.");
}
