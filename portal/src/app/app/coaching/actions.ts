"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addBusinessDays, hotSeatTarget, SCHEDULE_DEFAULTS } from "@/domain/schedule/calendar";
import { HOTSEAT_CONSENT_VERSION } from "@/domain/coaching";
import { isFeatureEnabled } from "@/lib/env";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { authorize } from "@/lib/server/session";
import { removeObject, storeUpload } from "@/lib/server/storage";



function flagged(flag: "coaching" | "feedback" | "community"): FormState | null {
  return isFeatureEnabled(flag) ? null : errorState("This area is not open yet.");
}

// ---------------------------------------------------------------- coaching

export async function askQuestion(_prev: FormState, fd: FormData): Promise<FormState> {
  const off = flagged("coaching");
  if (off) return off;
  const parsed = z.object({ session_id: z.string().uuid(), body: z.string().trim().min(3, "Write your question.").max(1500) }).safeParse({ session_id: fd.get("session_id"), body: fd.get("body") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check your question.");
  try {
    const { supabase, user } = await authorize("group_coaching.access");
    const { error } = await supabase.from("coaching_questions").insert({ ...parsed.data, user_id: user.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/coaching");
  return okState("Your question is in. Your coach sees it before the session.");
}

const hotSeatSchema = z.object({
  topic: z.string().trim().min(3, "Add a topic.").max(200),
  details: z.string().trim().min(10, "Share a little more detail.").max(4000),
  redaction_requests: z.string().trim().max(1000).optional(),
  consent: z.literal("on", { message: "Recording consent is required to apply." }),
});

export async function applyHotSeat(_prev: FormState, fd: FormData): Promise<FormState> {
  const off = flagged("coaching");
  if (off) return off;
  const parsed = hotSeatSchema.safeParse({ topic: fd.get("topic"), details: fd.get("details"), redaction_requests: fd.get("redaction_requests") ?? undefined, consent: fd.get("consent") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  const target = hotSeatTarget(new Date());
  try {
    const { supabase, user } = await authorize("hotseat.apply");
    const { error } = await supabase.from("hotseat_applications").insert({
      user_id: user.id,
      target_month: target.targetMonth,
      topic: parsed.data.topic,
      details: parsed.data.details,
      redaction_requests: parsed.data.redaction_requests || null,
      recording_consent: true,
      consent_text_version: HOTSEAT_CONSENT_VERSION,
    });
    if (error) throw new Error(/duplicate|unique/i.test(error.message) ? "You already applied for this month. Edit your application instead." : error.message);
  } catch (err) {
    return errorState(err instanceof Error && /already applied/.test(err.message) ? err.message : errorMessage(err));
  }
  revalidatePath("/app/coaching");
  return okState("Application received. You will hear back within 48 hours of the close.");
}

export async function updateHotSeat(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = z.string().uuid().safeParse(fd.get("id"));
  const withdraw = fd.get("withdraw") === "true";
  if (!id.success) return errorState("Invalid application.");
  try {
    const { supabase, user } = await authorize("hotseat.apply");
    if (withdraw) {
      const { data, error } = await supabase.from("hotseat_applications").update({ status: "withdrawn" }).eq("id", id.data).eq("user_id", user.id).select("id");
      if (error) throw new Error(error.message);
      if (!data?.length) return errorState("That application could not be changed.");
    } else {
      const parsed = hotSeatSchema.omit({ consent: true }).safeParse({ topic: fd.get("topic"), details: fd.get("details"), redaction_requests: fd.get("redaction_requests") ?? undefined });
      if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
      const { data, error } = await supabase
        .from("hotseat_applications")
        .update({ topic: parsed.data.topic, details: parsed.data.details, redaction_requests: parsed.data.redaction_requests || null })
        .eq("id", id.data)
        .eq("user_id", user.id)
        .select("id");
      if (error) throw new Error(error.message);
      if (!data?.length) return errorState("That application could not be changed.");
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/coaching");
  return okState(withdraw ? "Application withdrawn." : "Application updated.");
}

// ---------------------------------------------------------------- feedback

export async function submitFeedback(_prev: FormState, fd: FormData): Promise<FormState> {
  const off = flagged("feedback");
  if (off) return off;
  const parsed = z
    .object({
      deliverable_title: z.string().trim().min(3, "Name the one deliverable you want reviewed.").max(140),
      description: z.string().trim().min(10, "Tell your coach what you want feedback on.").max(4000),
      link_url: z.string().trim().max(500).refine((v) => v === "" || /^https:\/\//.test(v), "Links must start with https://"),
    })
    .safeParse({ deliverable_title: fd.get("deliverable_title"), description: fd.get("description"), link_url: fd.get("link_url") ?? "" });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  const file = fd.get("file");
  let stored: { key: string; mime: string } | null = null;
  try {
    const { supabase, user } = await authorize("feedback.submit");
    if (file instanceof File && file.size > 0) {
      const s = await storeUpload("feedback-files", user.id, file);
      if ("error" in s) return errorState(s.error);
      stored = { key: s.key, mime: s.mime };
    }
    const holidays = await supabase.from("business_holidays").select("holiday");
    const due = addBusinessDays(new Date(), SCHEDULE_DEFAULTS.feedback.responseBusinessDays, new Set((holidays.data ?? []).map((h) => h.holiday as string)));
    const { error } = await supabase.from("feedback_submissions").insert({
      user_id: user.id,
      cycle_start: new Date().toISOString(), // replaced by the database with the real cycle start
      deliverable_title: parsed.data.deliverable_title,
      description: parsed.data.description,
      link_url: parsed.data.link_url || null,
      file_key: stored?.key ?? null,
      file_mime: stored?.mime ?? null,
      response_due_at: due.toISOString(),
    });
    if (error) {
      if (stored) await removeObject("feedback-files", stored.key).catch(() => undefined);
      throw new Error(error.message);
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/feedback");
  return okState("Submitted. Your coach responds within three business days.");
}

export async function withdrawFeedback(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return errorState("Invalid submission.");
  try {
    const { supabase, user } = await authorize("feedback.submit");
    const { data, error } = await supabase.from("feedback_submissions").update({ state: "withdrawn" }).eq("id", id.data).eq("user_id", user.id).select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) return errorState("That submission could not be withdrawn.");
  } catch (err) {
    return errorState(errorMessage(err, "Review has already started, so this submission can no longer be withdrawn."));
  }
  revalidatePath("/app/feedback");
  return okState("Withdrawn. That submission no longer counts toward this cycle.");
}

// ---------------------------------------------------------------- community

export async function createPost(_prev: FormState, fd: FormData): Promise<FormState> {
  const off = flagged("community");
  if (off) return off;
  const parsed = z
    .object({ title: z.string().trim().min(3, "Add a title.").max(140), body: z.string().trim().min(3, "Write your post.").max(5000), tag: z.enum(["win", "question", "resource", ""]) })
    .safeParse({ title: fd.get("title"), body: fd.get("body"), tag: fd.get("tag") ?? "" });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check your post.");
  try {
    const { supabase, user } = await authorize("community.access");
    const { error } = await supabase.from("community_posts").insert({ user_id: user.id, title: parsed.data.title, body: parsed.data.body, tag: parsed.data.tag || null });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(err instanceof Error && /limit reached/.test(err.message) ? err.message : errorMessage(err));
  }
  revalidatePath("/app/community");
  return okState("Posted.");
}

export async function createComment(_prev: FormState, fd: FormData): Promise<FormState> {
  const off = flagged("community");
  if (off) return off;
  const parsed = z
    .object({ post_id: z.string().uuid(), parent_comment_id: z.string().uuid().or(z.literal("")), body: z.string().trim().min(1, "Write a reply.").max(3000) })
    .safeParse({ post_id: fd.get("post_id"), parent_comment_id: fd.get("parent_comment_id") ?? "", body: fd.get("body") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check your reply.");
  try {
    const { supabase, user } = await authorize("community.access");
    const { error } = await supabase.from("community_comments").insert({
      post_id: parsed.data.post_id,
      parent_comment_id: parsed.data.parent_comment_id || null,
      user_id: user.id,
      body: parsed.data.body,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(err instanceof Error && /limit reached/.test(err.message) ? err.message : errorMessage(err));
  }
  revalidatePath(`/app/community/${parsed.data.post_id}`);
  return okState("Reply posted.");
}

export async function deleteOwnContent(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), kind: z.enum(["post", "comment"]) }).safeParse({ id: fd.get("id"), kind: fd.get("kind") });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase, user } = await authorize(null);
    const table = parsed.data.kind === "post" ? "community_posts" : "community_comments";
    const { data, error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", parsed.data.id).eq("user_id", user.id).select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) return errorState("That could not be deleted.");
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/app/community", "layout");
  return okState("Deleted. It is hidden right away.");
}

export async function reportContent(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ post_id: z.string().uuid().or(z.literal("")), comment_id: z.string().uuid().or(z.literal("")), reason: z.string().trim().min(3, "Tell us briefly what is wrong.").max(500) })
    .safeParse({ post_id: fd.get("post_id") ?? "", comment_id: fd.get("comment_id") ?? "", reason: fd.get("reason") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the report.");
  try {
    const { supabase, user } = await authorize("community.access");
    const { error } = await supabase.from("community_reports").insert({
      reporter_id: user.id,
      post_id: parsed.data.comment_id ? null : parsed.data.post_id || null,
      comment_id: parsed.data.comment_id || null,
      reason: parsed.data.reason,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  return okState("Thank you. A moderator will review it.");
}
