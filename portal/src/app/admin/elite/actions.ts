"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eliteDecision } from "@/domain/email/templates";
import { easternWallToUtc } from "@/domain/schedule/calendar";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/server/email";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { authorizeStaff } from "@/lib/server/staff";
import { storeUpload } from "@/lib/server/storage";

export async function decideApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ id: z.string().uuid(), status: z.enum(["reviewing", "discovery_scheduled", "accepted", "declined"]), note: z.string().trim().max(2000), discovery_at: z.string() })
    .safeParse({ id: fd.get("id"), status: fd.get("status"), note: fd.get("note") ?? "", discovery_at: fd.get("discovery_at") ?? "" });
  if (!parsed.success) return errorState("Invalid decision.");
  try {
    const { supabase } = await authorizeStaff(["admin", "coach"]);
    const { error } = await supabase.rpc("staff_decide_elite", {
      p_id: parsed.data.id,
      p_status: parsed.data.status,
      p_note: parsed.data.note || null,
      p_discovery_at: parsed.data.discovery_at ? easternWallToUtc(parsed.data.discovery_at).toISOString() : null,
    });
    if (error) throw new Error(error.message);
    if (parsed.data.status === "accepted" || parsed.data.status === "declined") {
      const app = await supabase.from("elite_applications").select("name, email").eq("id", parsed.data.id).single();
      if (app.data) {
        const site = publicEnv().NEXT_PUBLIC_SITE_URL;
        await sendEmail(app.data.email as string, eliteDecision({ name: app.data.name as string, accepted: parsed.data.status === "accepted", url: parsed.data.status === "accepted" ? `${site}/signup` : `${site}/app/plans` }));
      }
    }
  } catch (err) {
    return errorState(err instanceof Error && /seats/.test(err.message) ? err.message : errorMessage(err));
  }
  revalidatePath("/admin/elite");
  return okState(parsed.data.status === "accepted" ? "Accepted. The seat is held for 14 days while they enroll." : "Saved.");
}

export async function assignCoach(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ board_id: z.string().uuid(), coach_id: z.string().uuid().or(z.literal("")) }).safeParse({ board_id: fd.get("board_id"), coach_id: fd.get("coach_id") });
  if (!parsed.success) return errorState("Choose a coach.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const board = await supabase.from("elite_boards").update({ coach_id: parsed.data.coach_id || null }).eq("id", parsed.data.board_id).select("client_id").single();
    if (board.error) throw new Error(board.error.message);
    if (parsed.data.coach_id) {
      await supabase.from("coach_assignments").upsert({ coach_id: parsed.data.coach_id, student_id: board.data.client_id as string }, { onConflict: "coach_id,student_id", ignoreDuplicates: true });
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/elite", "layout");
  return okState("Coach assigned.");
}

const itemSchema = z.object({
  id: z.string().uuid().or(z.literal("")),
  board_id: z.string().uuid(),
  kind: z.enum(["roadmap", "task", "deliverable", "audit", "coach_note", "request"]),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(20000),
  status: z.enum(["open", "in_progress", "waiting_on_client", "done", "submitted", "scoped", "completed", "declined", "archived"]),
  month_number: z.string().regex(/^[1-6]?$/),
  due_on: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
  estimated_minutes: z.string().regex(/^\d{0,4}$/),
  completion_summary: z.string().trim().max(4000),
});

export async function saveItem(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = itemSchema.safeParse(Object.fromEntries(["id", "board_id", "kind", "title", "body", "status", "month_number", "due_on", "estimated_minutes", "completion_summary"].map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the item.");
  const d = parsed.data;
  if (d.kind === "request" && d.status === "completed" && !d.completion_summary) return errorState("Add a completion summary before marking a request complete.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const row = {
      board_id: d.board_id,
      kind: d.kind,
      title: d.title,
      body: d.body || null,
      status: d.status,
      month_number: d.month_number ? Number(d.month_number) : null,
      due_on: d.due_on || null,
      estimated_minutes: d.estimated_minutes ? Number(d.estimated_minutes) : null,
      completion_summary: d.completion_summary || null,
    };
    const r = d.id ? await supabase.from("elite_items").update(row).eq("id", d.id) : await supabase.from("elite_items").insert({ ...row, created_by: user.id });
    if (r.error) throw new Error(r.error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/elite/${parsed.data.board_id}`);
  return okState("Saved.");
}

export async function logTime(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ board_id: z.string().uuid(), bucket_id: z.string().uuid(), item_id: z.string().uuid().or(z.literal("")), hours: z.coerce.number().int().min(0).max(10), minutes: z.coerce.number().int().min(0).max(59), work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().trim().min(3, "Describe the work.").max(1000) })
    .safeParse(Object.fromEntries(["board_id", "bucket_id", "item_id", "hours", "minutes", "work_date", "note"].map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the time entry.");
  const total = parsed.data.hours * 60 + parsed.data.minutes;
  if (total < 1) return errorState("Record at least one minute.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const { error } = await supabase.from("elite_time_entries").insert({
      board_id: parsed.data.board_id,
      bucket_id: parsed.data.bucket_id,
      item_id: parsed.data.item_id || null,
      minutes: total,
      work_date: parsed.data.work_date,
      note: parsed.data.note,
      coach_id: user.id,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(err instanceof Error && /minutes remaining|expired/.test(err.message) ? err.message : errorMessage(err));
  }
  revalidatePath(`/admin/elite/${parsed.data.board_id}`);
  return okState(`Recorded ${total} minutes.`);
}

export async function voidTime(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), board_id: z.string().uuid(), reason: z.string().trim().min(5, "Give a reason.").max(500) }).safeParse({ id: fd.get("id"), board_id: fd.get("board_id"), reason: fd.get("reason") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Give a reason.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.from("elite_time_entries").update({ voided_at: new Date().toISOString(), void_reason: parsed.data.reason }).eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/elite/${parsed.data.board_id}`);
  return okState("Entry voided. The minutes are available again.");
}

export async function recordPackage(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ board_id: z.string().uuid(), hours: z.enum(["3", "5", "10"]), note: z.string().trim().min(5, "Add the payment reference.").max(500) }).safeParse({ board_id: fd.get("board_id"), hours: fd.get("hours"), note: fd.get("note") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the package.");
  try {
    const { supabase, user } = await authorizeStaff(["admin"]);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 3);
    const { error } = await supabase.from("elite_hour_buckets").insert({ board_id: parsed.data.board_id, kind: "package", minutes_granted: Number(parsed.data.hours) * 60, expires_at: expires.toISOString(), note: parsed.data.note, created_by: user.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/elite/${parsed.data.board_id}`);
  return okState("Package recorded. It expires in three months.");
}

export async function scheduleSessions(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ board_id: z.string().uuid(), first: z.string().min(10), weeks: z.coerce.number().int().min(1).max(26), meeting_url_private: z.string().trim().refine((v) => v === "" || /^https:\/\//.test(v), "Use an https link.") }).safeParse({ board_id: fd.get("board_id"), first: fd.get("first"), weeks: fd.get("weeks"), meeting_url_private: fd.get("meeting_url_private") ?? "" });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the schedule.");
  try {
    const { supabase } = await authorizeStaff(["admin", "coach"]);
    const [date, time] = parsed.data.first.split("T") as [string, string];
    const rows = Array.from({ length: parsed.data.weeks }, (_, i) => {
      const d = new Date(`${date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 7 * i);
      const start = easternWallToUtc(`${d.toISOString().slice(0, 10)}T${time}`);
      return { board_id: parsed.data.board_id, starts_at: start.toISOString(), ends_at: new Date(start.getTime() + 3600000).toISOString(), meeting_url_private: parsed.data.meeting_url_private || null };
    });
    const { error } = await supabase.from("elite_sessions").insert(rows);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/elite/${parsed.data.board_id}`);
  return okState(`Scheduled ${parsed.data.weeks} weekly sessions.`);
}

export async function setPrivateSessionStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), board_id: z.string().uuid(), status: z.enum(["completed", "no_show", "coach_canceled"]), replacement: z.string() }).safeParse({ id: fd.get("id"), board_id: fd.get("board_id"), status: fd.get("status"), replacement: fd.get("replacement") ?? "" });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase } = await authorizeStaff(["admin", "coach"]);
    const s = await supabase.from("elite_sessions").update({ status: parsed.data.status }).eq("id", parsed.data.id).select("meeting_url_private").single();
    if (s.error) throw new Error(s.error.message);
    if (parsed.data.status === "coach_canceled" && parsed.data.replacement) {
      const start = easternWallToUtc(parsed.data.replacement);
      const { error } = await supabase.from("elite_sessions").insert({ board_id: parsed.data.board_id, starts_at: start.toISOString(), ends_at: new Date(start.getTime() + 3600000).toISOString(), meeting_url_private: s.data.meeting_url_private, replaces_session_id: parsed.data.id });
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/elite/${parsed.data.board_id}`);
  return okState(parsed.data.status === "coach_canceled" ? "Canceled by coach. A replacement session was added." : "Updated.");
}

export async function uploadEliteFile(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ board_id: z.string().uuid(), label: z.string().trim().min(2).max(140), item_id: z.string().uuid().or(z.literal("")) }).safeParse({ board_id: fd.get("board_id"), label: fd.get("label"), item_id: fd.get("item_id") ?? "" });
  const file = fd.get("file");
  if (!parsed.success || !(file instanceof File) || file.size === 0) return errorState("Add a label and choose a file.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const stored = await storeUpload("elite-files", parsed.data.board_id, file);
    if ("error" in stored) return errorState(stored.error);
    const { error } = await supabase.from("elite_files").insert({ board_id: parsed.data.board_id, item_id: parsed.data.item_id || null, label: parsed.data.label, storage_key: stored.key, mime_type: stored.mime, uploaded_by: user.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err, "The file could not be uploaded. Check that storage is configured."));
  }
  revalidatePath(`/admin/elite/${parsed.data.board_id}`);
  return okState("File shared with the client.");
}
