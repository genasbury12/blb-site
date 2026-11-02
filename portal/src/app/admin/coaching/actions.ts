"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { feedbackResponded, hotSeatDecision } from "@/domain/email/templates";
import { easternWallToUtc, groupCoachingOccurrences, hotSeatForMonth, zonedParts } from "@/domain/schedule/calendar";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/server/email";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { memberContact } from "@/lib/server/members";
import { authorizeStaff } from "@/lib/server/staff";

const httpsOrEmpty = z.string().trim().max(500).refine((v) => v === "" || /^https:\/\//.test(v), "Links must start with https://");

// ---------------------------------------------------------------- sessions

const sessionSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  kind: z.enum(["group", "hot_seat"]),
  title: z.string().trim().min(3).max(140),
  agenda: z.string().trim().max(4000),
  starts_at: z.string().min(10),
  duration: z.coerce.number().int().min(15).max(240),
  meeting_url_private: httpsOrEmpty,
  recording_url_private: httpsOrEmpty,
  published: z.boolean(),
});

const easternToUtc = easternWallToUtc;

export async function saveSession(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = sessionSchema.safeParse({
    id: fd.get("id") ?? "",
    kind: fd.get("kind"),
    title: fd.get("title"),
    agenda: fd.get("agenda") ?? "",
    starts_at: fd.get("starts_at"),
    duration: fd.get("duration"),
    meeting_url_private: fd.get("meeting_url_private") ?? "",
    recording_url_private: fd.get("recording_url_private") ?? "",
    published: fd.get("published") === "on",
  });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const start = easternToUtc(parsed.data.starts_at);
    const row = {
      kind: parsed.data.kind,
      title: parsed.data.title,
      agenda: parsed.data.agenda || null,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + parsed.data.duration * 60000).toISOString(),
      meeting_url_private: parsed.data.meeting_url_private || null,
      recording_url_private: parsed.data.recording_url_private || null,
      published: parsed.data.published,
    };
    const r = parsed.data.id
      ? await supabase.from("coaching_sessions").update(row).eq("id", parsed.data.id)
      : await supabase.from("coaching_sessions").insert({ ...row, created_by: user.id });
    if (r.error) throw new Error(r.error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/coaching");
  return okState("Session saved.");
}

/** Create the next weeks of Wednesday sessions as unpublished drafts, skipping published holidays (D12). */
export async function generateWeeklySessions(_prev: FormState, fd: FormData): Promise<FormState> {
  const weeks = z.coerce.number().int().min(1).max(12).safeParse(fd.get("weeks") ?? 8);
  if (!weeks.success) return errorState("Choose 1 to 12 weeks.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const holidays = new Set(((await supabase.from("business_holidays").select("holiday")).data ?? []).map((h) => h.holiday as string));
    const occ = groupCoachingOccurrences(new Date(), weeks.data);
    const skipped: string[] = [];
    const rows = occ
      .filter((o) => {
        const p = zonedParts(o.startsAt);
        const key = `${p.year}-${String(p.monthIndex + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
        if (holidays.has(key)) skipped.push(key);
        return !holidays.has(key);
      })
      .map((o) => ({ kind: "group", title: "Weekly group coaching", starts_at: o.startsAt.toISOString(), ends_at: o.endsAt.toISOString(), published: false, created_by: user.id }));
    const { error } = await supabase.from("coaching_sessions").upsert(rows, { onConflict: "kind,starts_at", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/coaching");
    return okState(`Created up to ${rows.length} draft sessions. Add the join link and publish each one.${skipped.length ? ` Skipped holidays: ${skipped.join(", ")}.` : ""}`);
  } catch (err) {
    return errorState(errorMessage(err));
  }
}

export async function createHotSeatSession(_prev: FormState, fd: FormData): Promise<FormState> {
  const month = z.string().regex(/^\d{4}-\d{2}$/).safeParse(fd.get("month"));
  if (!month.success) return errorState("Choose a month.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const [y, m] = month.data.split("-").map(Number) as [number, number];
    const hs = hotSeatForMonth(y, m - 1);
    const { error } = await supabase.from("coaching_sessions").upsert(
      { kind: "hot_seat", title: "Monthly Hot Seat", starts_at: hs.session.startsAt.toISOString(), ends_at: hs.session.endsAt.toISOString(), published: false, created_by: user.id },
      { onConflict: "kind,starts_at", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/coaching");
  return okState("Hot Seat session created as a draft.");
}

export async function setSessionStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["scheduled", "canceled", "completed"]), note: z.string().trim().max(300) }).safeParse({ id: fd.get("id"), status: fd.get("status"), note: fd.get("note") ?? "" });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase } = await authorizeStaff(["admin", "coach"]);
    const { error } = await supabase.from("coaching_sessions").update({ status: parsed.data.status, cancel_note: parsed.data.note || null }).eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/coaching");
  return okState(`Session marked ${parsed.data.status}. Members see the change in the Coaching Hub.`);
}

// ---------------------------------------------------------------- Hot Seat

export async function decideHotSeat(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), decision: z.enum(["selected", "not_selected", "carry"]), note: z.string().trim().max(1000) }).safeParse({ id: fd.get("id"), decision: fd.get("decision"), note: fd.get("note") ?? "" });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const app = await supabase.from("hotseat_applications").select("user_id, target_month").eq("id", parsed.data.id).single();
    if (app.error) throw new Error(app.error.message);
    if (parsed.data.decision === "carry") {
      const r = await supabase.rpc("staff_carry_forward_hotseat", { p_id: parsed.data.id });
      if (r.error) throw new Error(r.error.message);
    } else {
      const r = await supabase.from("hotseat_applications").update({ status: parsed.data.decision, decision_note: parsed.data.note || null, decided_by: user.id, decided_at: new Date().toISOString() }).eq("id", parsed.data.id);
      if (r.error) throw new Error(r.error.message);
    }
    const contact = await memberContact(app.data.user_id as string);
    if (contact.email) {
      const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(app.data.target_month as string));
      await sendEmail(contact.email, hotSeatDecision({ name: contact.name, selected: parsed.data.decision === "selected", month, url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/app/coaching` }));
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/coaching");
  return okState("Decision saved and the member was notified.");
}

// ---------------------------------------------------------------- workshops

const workshopSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  title: z.string().trim().min(3).max(140),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,80}$/, "Use lowercase letters, numbers and dashes."),
  description: z.string().trim().max(4000),
  release_at: z.string().min(10),
  video_provider_id: z.string().trim().max(80).refine((v) => v === "" || /^[A-Za-z0-9]{10,80}$/.test(v), "Paste the Mux playback ID."),
  captions_ready: z.boolean(),
  transcript: z.string().max(200000),
  duration_minutes: z.coerce.number().min(0).max(240),
});

export async function saveWorkshop(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = workshopSchema.safeParse({
    id: fd.get("id") ?? "",
    title: fd.get("title"),
    slug: fd.get("slug"),
    description: fd.get("description") ?? "",
    release_at: fd.get("release_at"),
    video_provider_id: fd.get("video_provider_id") ?? "",
    captions_ready: fd.get("captions_ready") === "on",
    transcript: fd.get("transcript") ?? "",
    duration_minutes: fd.get("duration_minutes") || 0,
  });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const d = parsed.data;
    const row = {
      title: d.title,
      slug: d.slug,
      description: d.description || null,
      release_at: easternToUtc(d.release_at).toISOString(),
      video_provider_id: d.video_provider_id || null,
      captions_ready: d.captions_ready,
      transcript: d.transcript || null,
      duration_seconds: d.duration_minutes ? Math.round(d.duration_minutes * 60) : null,
    };
    const r = d.id ? await supabase.from("workshops").update(row).eq("id", d.id) : await supabase.from("workshops").insert({ ...row, status: "draft" });
    if (r.error) throw new Error(r.error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/workshops");
  return okState("Workshop saved.");
}

// ---------------------------------------------------------------- feedback

export async function respondToFeedback(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ id: z.string().uuid(), state: z.enum(["in_review", "responded"]), response_text: z.string().trim().max(10000), response_video_url: httpsOrEmpty })
    .safeParse({ id: fd.get("id"), state: fd.get("state"), response_text: fd.get("response_text") ?? "", response_video_url: fd.get("response_video_url") ?? "" });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the response.");
  if (parsed.data.state === "responded" && !parsed.data.response_text && !parsed.data.response_video_url) return errorState("Write a response or add a recording link.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const { data, error } = await supabase
      .from("feedback_submissions")
      .update(
        parsed.data.state === "responded"
          ? { state: "responded", response_text: parsed.data.response_text || null, response_video_url: parsed.data.response_video_url || null, responder_id: user.id }
          : { state: "in_review" },
      )
      .eq("id", parsed.data.id)
      .select("user_id, deliverable_title");
    if (error) throw new Error(error.message);
    if (!data?.length) return errorState("You can respond only to members assigned to you.");
    if (parsed.data.state === "responded") {
      const contact = await memberContact(data[0]!.user_id as string);
      if (contact.email) await sendEmail(contact.email, feedbackResponded({ name: contact.name, title: data[0]!.deliverable_title as string, url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/app/feedback` }));
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/feedback");
  return okState(parsed.data.state === "responded" ? "Response sent." : "Marked in review.");
}

// ---------------------------------------------------------------- community

export async function moderate(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ id: z.string().uuid(), kind: z.enum(["post", "comment"]), action: z.enum(["visible", "hidden", "removed", "pin", "unpin"]), report_id: z.string().uuid().or(z.literal("")) })
    .safeParse({ id: fd.get("id"), kind: fd.get("kind"), action: fd.get("action"), report_id: fd.get("report_id") ?? "" });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const table = parsed.data.kind === "post" ? "community_posts" : "community_comments";
    const patch = parsed.data.action === "pin" ? { pinned: true } : parsed.data.action === "unpin" ? { pinned: false } : { moderation_status: parsed.data.action };
    const { error } = await supabase.from(table).update(patch).eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
    if (parsed.data.report_id) await supabase.from("community_reports").update({ status: "resolved", resolved_by: user.id }).eq("id", parsed.data.report_id);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/community");
  revalidatePath("/app/community", "layout");
  return okState("Updated.");
}

export async function postAnnouncement(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ title: z.string().trim().min(3).max(140), body: z.string().trim().min(3).max(5000) }).safeParse({ title: fd.get("title"), body: fd.get("body") });
  if (!parsed.success) return errorState("Add a title and message.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const { error } = await supabase.from("community_posts").insert({ ...parsed.data, user_id: user.id, tag: "announcement", pinned: true });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/community");
  return okState("Announcement posted and pinned.");
}

export async function saveHoliday(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ holiday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), name: z.string().trim().min(2).max(80), remove: z.enum(["true", "false"]) }).safeParse({ holiday: fd.get("holiday"), name: fd.get("name") ?? "holiday", remove: fd.get("remove") ?? "false" });
  if (!parsed.success) return errorState("Choose a date and name.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const r = parsed.data.remove === "true"
      ? await supabase.from("business_holidays").delete().eq("holiday", parsed.data.holiday)
      : await supabase.from("business_holidays").upsert({ holiday: parsed.data.holiday, name: parsed.data.name });
    if (r.error) throw new Error(r.error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/coaching");
  return okState("Holidays updated.");
}

