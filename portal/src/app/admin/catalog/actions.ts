"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CONTENT_STATUSES as STATUSES, canTransition, type ContentStatus } from "@/domain/content";
import { worksheetSchemaSchema } from "@/domain/worksheets/schema";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { authorizeStaff } from "@/lib/server/staff";
import { removeObject, storeUpload } from "@/lib/server/storage";

const optional = (max: number) => z.string().trim().max(max).transform((v) => (v === "" ? null : v));
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,80}$/, "Use 3 to 80 lowercase letters, numbers, or dashes.");

const lessonSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().trim().min(3).max(140),
  slug,
  order_index: z.coerce.number().int().min(1).max(99),
  essential: z.boolean(),
  objective: optional(2000),
  assignment: optional(4000),
  transcript: optional(100000),
  ai_prompt: optional(4000),
  ai_assistant_url: optional(500).refine((v) => v === null || /^https:\/\//.test(v), "Use an https link."),
  path_note_build: optional(2000),
  path_note_optimize: optional(2000),
  video_provider_id: optional(80).refine((v) => v === null || /^[A-Za-z0-9]{10,80}$/.test(v), "Paste the Mux playback ID."),
  captions_ready: z.boolean(),
  duration_minutes: z.coerce.number().min(0).max(120),
});

function lessonFromForm(fd: FormData) {
  return lessonSchema.safeParse({
    module_id: fd.get("module_id"),
    title: fd.get("title"),
    slug: fd.get("slug"),
    order_index: fd.get("order_index"),
    essential: fd.get("essential") === "on",
    objective: fd.get("objective") ?? "",
    assignment: fd.get("assignment") ?? "",
    transcript: fd.get("transcript") ?? "",
    ai_prompt: fd.get("ai_prompt") ?? "",
    ai_assistant_url: fd.get("ai_assistant_url") ?? "",
    path_note_build: fd.get("path_note_build") ?? "",
    path_note_optimize: fd.get("path_note_optimize") ?? "",
    video_provider_id: fd.get("video_provider_id") ?? "",
    captions_ready: fd.get("captions_ready") === "on",
    duration_minutes: fd.get("duration_minutes") || 0,
  });
}

function toRow(d: z.infer<typeof lessonSchema>) {
  const { duration_minutes, ...rest } = d;
  return {
    ...rest,
    video_provider: rest.video_provider_id ? "mux" : null,
    duration_seconds: duration_minutes > 0 ? Math.round(duration_minutes * 60) : null,
  };
}

export async function createLesson(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = lessonFromForm(fd);
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  let id: string;
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { data, error } = await supabase.from("lessons").insert({ ...toRow(parsed.data), status: "draft" }).select("id").single();
    if (error) throw new Error(error.message);
    id = data.id as string;
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/catalog");
  redirect(`/admin/catalog/lessons/${id}?created=1`);
}

export async function updateLesson(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = z.string().uuid().safeParse(fd.get("id"));
  const parsed = lessonFromForm(fd);
  if (!id.success || !parsed.success) return errorState(parsed.success ? "Invalid lesson." : parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.from("lessons").update(toRow(parsed.data)).eq("id", id.data);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/catalog");
  revalidatePath("/app", "layout");
  return okState("Lesson saved.");
}

const transitionSchema = z.object({ id: z.string().uuid(), table: z.enum(["lessons", "modules", "library_items", "milestones", "workshops", "worksheets"]), to: z.enum(STATUSES) });

export async function changeStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = transitionSchema.safeParse({ id: fd.get("id"), table: fd.get("table"), to: fd.get("to") });
  if (!parsed.success) return errorState("Invalid status change.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const current = await supabase.from(parsed.data.table).select("status").eq("id", parsed.data.id).single();
    if (current.error) throw new Error(current.error.message);
    const from = current.data.status as ContentStatus;
    if (!canTransition(from, parsed.data.to)) return errorState(`A ${from} item cannot move straight to ${parsed.data.to}.`);
    if (parsed.data.table === "worksheets" && parsed.data.to === "published") {
      // Never publish a worksheet the member form cannot render.
      const ws = await supabase.from("worksheets").select("schema").eq("id", parsed.data.id).single();
      if (ws.error) throw new Error(ws.error.message);
      const check = worksheetSchemaSchema.safeParse(ws.data.schema);
      if (!check.success) return errorState(`This worksheet's schema is not valid (${check.error.issues[0]?.path.join(".") || "root"}: ${check.error.issues[0]?.message}).`);
    }
    const { error } = await supabase.from(parsed.data.table).update({ status: parsed.data.to }).eq("id", parsed.data.id);
    if (error) {
      if (error.message.includes("worksheets_one_published_idx")) return errorState("Another version of this worksheet is already published. Archive it first.");
      if (error.message.includes("worksheets_one_published_per_lesson_idx")) return errorState("Another worksheet is already published on this lesson. Archive it first.");
      throw new Error(error.message);
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/app", "layout");
  return okState(`Moved to ${parsed.data.to}.`);
}

const moduleSchema = z.object({ id: z.string().uuid(), title: z.string().trim().min(3).max(120), outcome: z.string().trim().min(3).max(400) });

export async function updateModule(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = moduleSchema.safeParse({ id: fd.get("id"), title: fd.get("title"), outcome: fd.get("outcome") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.from("modules").update({ title: parsed.data.title, outcome: parsed.data.outcome }).eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/catalog");
  return okState("Module saved.");
}

const milestoneSchema = z.object({ module_id: z.string().uuid(), title: z.string().trim().min(3).max(200), slug, order_index: z.coerce.number().int().min(1).max(99) });

export async function createMilestone(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = milestoneSchema.safeParse({ module_id: fd.get("module_id"), title: fd.get("title"), slug: fd.get("slug"), order_index: fd.get("order_index") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.from("milestones").insert({ ...parsed.data, status: "draft" });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/catalog/modules/${parsed.data.module_id}`);
  return okState("Milestone added as a draft.");
}

export async function uploadResource(_prev: FormState, fd: FormData): Promise<FormState> {
  const lessonId = z.string().uuid().safeParse(fd.get("lesson_id"));
  const label = z.string().trim().min(2).max(140).safeParse(fd.get("label"));
  const file = fd.get("file");
  if (!lessonId.success || !label.success || !(file instanceof File) || file.size === 0) return errorState("Add a label and choose a file.");
  try {
    const { supabase, user } = await authorizeStaff(["admin"]);
    const stored = await storeUpload("lesson-resources", "lessons", file);
    if ("error" in stored) return errorState(stored.error);
    const { error } = await supabase.from("lesson_resources").insert({
      lesson_id: lessonId.data,
      label: label.data,
      storage_key: stored.key,
      mime_type: stored.mime,
      file_name: file.name.slice(0, 200),
      size_bytes: stored.size,
      created_by: user.id,
      published: false,
    });
    if (error) {
      await removeObject("lesson-resources", stored.key);
      throw new Error(error.message);
    }
  } catch (err) {
    return errorState(errorMessage(err, "The file could not be uploaded. Check that storage is configured."));
  }
  revalidatePath(`/admin/catalog/lessons/${lessonId.data}`);
  return okState("Uploaded. Open and check the file, then mark it checked and published.");
}

export async function setResourceState(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), lesson_id: z.string().uuid(), action: z.enum(["publish", "unpublish", "delete"]) }).safeParse({
    id: fd.get("id"),
    lesson_id: fd.get("lesson_id"),
    action: fd.get("action"),
  });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    if (parsed.data.action === "delete") {
      const row = await supabase.from("lesson_resources").delete().eq("id", parsed.data.id).select("storage_key").single();
      if (row.error) throw new Error(row.error.message);
      await removeObject("lesson-resources", row.data.storage_key as string).catch(() => undefined);
    } else {
      const publish = parsed.data.action === "publish";
      const { error } = await supabase
        .from("lesson_resources")
        .update(publish ? { published: true, checked_at: new Date().toISOString() } : { published: false })
        .eq("id", parsed.data.id);
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/catalog/lessons/${parsed.data.lesson_id}`);
  return okState("Updated.");
}

export async function suggestEdit(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ lesson_id: z.string().uuid(), body: z.string().trim().min(3).max(4000) }).safeParse({ lesson_id: fd.get("lesson_id"), body: fd.get("body") });
  if (!parsed.success) return errorState("Write a suggestion first.");
  try {
    const { supabase, user } = await authorizeStaff(["admin", "coach"]);
    const { error } = await supabase.from("content_suggestions").insert({ ...parsed.data, author_id: user.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/catalog/lessons/${parsed.data.lesson_id}`);
  return okState("Suggestion sent to the admin.");
}

export async function resolveSuggestion(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), lesson_id: z.string().uuid(), status: z.enum(["accepted", "declined"]) }).safeParse({
    id: fd.get("id"),
    lesson_id: fd.get("lesson_id"),
    status: fd.get("status"),
  });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase, user } = await authorizeStaff(["admin"]);
    const { error } = await supabase
      .from("content_suggestions")
      .update({ status: parsed.data.status, resolved_by: user.id, resolved_at: new Date().toISOString() })
      .eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath(`/admin/catalog/lessons/${parsed.data.lesson_id}`);
  return okState("Suggestion resolved.");
}

const librarySchema = z.object({
  title: z.string().trim().min(3).max(140),
  slug,
  kind: z.enum(["walkthrough", "tutorial", "automation_recipe", "ai_prompt", "template", "troubleshooting"]),
  summary: z.string().trim().min(3).max(400),
  body: optional(20000),
  external_url: optional(500).refine((v) => v === null || /^https:\/\//.test(v), "Use an https link."),
  tool_cost_note: optional(400),
  module_number: z.coerce.number().int().min(0).max(8),
  tags: z.string().trim().max(300),
});

function libraryFromForm(fd: FormData) {
  const r = librarySchema.safeParse(Object.fromEntries(["title", "slug", "kind", "summary", "body", "external_url", "tool_cost_note", "module_number", "tags"].map((k) => [k, fd.get(k) ?? ""])));
  if (!r.success) return r;
  const { tags, module_number, ...rest } = r.data;
  return {
    success: true as const,
    data: {
      ...rest,
      module_number: module_number === 0 ? null : module_number,
      tags: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12),
    },
  };
}

export async function saveLibraryItem(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = libraryFromForm(fd);
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.");
  const id = fd.get("id");
  let newId: string | null = null;
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    if (typeof id === "string" && id) {
      const { error } = await supabase.from("library_items").update(parsed.data).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("library_items").insert({ ...parsed.data, status: "draft" }).select("id").single();
      if (error) throw new Error(error.message);
      newId = data.id as string;
    }
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/library");
  if (newId) redirect(`/admin/library/${newId}`);
  return okState("Library item saved.");
}
