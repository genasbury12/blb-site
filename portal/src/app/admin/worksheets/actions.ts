"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { worksheetSchemaSchema } from "@/domain/worksheets/schema";
import { errorMessage, errorState, formValues, okState, type FormState } from "@/lib/server/form-result";
import { authorizeStaff } from "@/lib/server/staff";
import { attachWorksheetTo } from "@/lib/server/worksheet-attach";

/**
 * Admin management of worksheets (owner request 2026-11-06): attach or move a worksheet to a lesson, create a new
 * worksheet record, and load its questions from a schema file. Every change runs as the signed in admin, so the audit
 * trigger records it.
 */

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,80}$/, "Use 3 to 80 lowercase letters, numbers, or dashes.");
const lessonId = z.union([z.literal(""), z.string().uuid()]).transform((v) => (v === "" ? null : v));

function refresh(worksheetSlug?: string) {
  revalidatePath("/admin/worksheets", "layout");
  revalidatePath("/admin/catalog", "layout");
  revalidatePath("/app", "layout");
  if (worksheetSlug) revalidatePath(`/admin/worksheets/${worksheetSlug}`);
}

/** Attached to lesson: move the worksheet to the chosen lesson, or detach it ("Not attached"). */
export async function setWorksheetLesson(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd);
  const parsed = z.object({ slug, lesson_id: lessonId }).safeParse({ slug: fd.get("slug"), lesson_id: fd.get("lesson_id") ?? "" });
  if (!parsed.success) return errorState("Choose a lesson.", values);
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const failed = await attachWorksheetTo(supabase, parsed.data.slug, parsed.data.lesson_id);
    if (failed) return errorState(failed, values);
  } catch (err) {
    return errorState(errorMessage(err), values);
  }
  refresh(parsed.data.slug);
  return okState(parsed.data.lesson_id ? "Worksheet attached." : "Worksheet detached. Members will not see it on any lesson.");
}

/**
 * Questions are written as a schema file (JSON, the same shape as docs/worksheet_m1-l3-customer-research.json).
 * Pasted here, it is checked exactly like the files seeded so far; its slug is set to this worksheet's.
 */
function questionsFrom(json: string, worksheetSlug: string, title: string): { schema?: Record<string, unknown>; error?: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { error: "The questions are not valid JSON. Paste the whole schema file." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "The questions must be one JSON object (a whole schema file)." };
  const schema: Record<string, unknown> = { ...(raw as Record<string, unknown>), slug: worksheetSlug };
  if (!schema.title) schema.title = title;
  const check = worksheetSchemaSchema.safeParse(schema);
  if (!check.success) {
    const issue = check.error.issues[0];
    return { error: `The questions do not fit the worksheet format (${issue?.path.join(".") || "top level"}: ${issue?.message}).` };
  }
  return { schema };
}

/** Placeholder for a worksheet whose questions are not written yet: valid, renders a note, cannot be published. */
function placeholder(worksheetSlug: string, title: string) {
  return {
    slug: worksheetSlug,
    title,
    intro: { title },
    sections: [{ key: "questions", title: "Questions coming soon", guide: "The questions for this worksheet have not been added yet." }],
    completion: { required_fields: [] },
  };
}

export async function createWorksheet(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd);
  const parsed = z
    .object({ title: z.string().trim().min(3, "Give it a title of at least 3 characters.").max(200), slug, lesson_id: lessonId, questions: z.string().max(400_000).default("") })
    .safeParse({ title: fd.get("title"), slug: fd.get("slug"), lesson_id: fd.get("lesson_id") ?? "", questions: fd.get("questions") ?? "" });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.", values);
  const d = parsed.data;
  if (d.slug === "new") return errorState("That slug is reserved. Choose another slug.", values);
  const q: { schema?: Record<string, unknown>; error?: string } = d.questions.trim() ? questionsFrom(d.questions, d.slug, d.title) : { schema: placeholder(d.slug, d.title) };
  if (q.error) return errorState(q.error, values);
  try {
    const { supabase, user } = await authorizeStaff(["admin"]);
    const { data: taken } = await supabase.from("worksheets").select("title").eq("slug", d.slug).limit(1).maybeSingle();
    if (taken) return errorState(`That slug is already used by "${taken.title as string}". Choose another slug.`, values);
    // Created unattached, then attached through the same path as a move, so a lesson's old worksheet is detached
    // and logged the same way.
    const { error } = await supabase.from("worksheets").insert({ slug: d.slug, version: 1, title: d.title, schema: q.schema, status: "draft", lesson_id: null, created_by: user.id });
    if (error) throw new Error(error.message);
    if (d.lesson_id) {
      const failed = await attachWorksheetTo(supabase, d.slug, d.lesson_id);
      if (failed) return errorState(`Worksheet created, but not attached: ${failed}`, values);
    }
  } catch (err) {
    return errorState(errorMessage(err), values);
  }
  refresh(d.slug);
  redirect(`/admin/worksheets/${d.slug}?created=1`);
}

/** Load questions from a schema file into a worksheet that is still a draft. Published worksheets are left alone. */
export async function replaceWorksheetQuestions(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd);
  const parsed = z.object({ id: z.string().uuid(), questions: z.string().trim().min(2, "Paste the schema file first.").max(400_000) }).safeParse({ id: fd.get("id"), questions: fd.get("questions") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Check the form.", values);
  let worksheetSlug: string;
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { data: row } = await supabase.from("worksheets").select("slug, title, status").eq("id", parsed.data.id).maybeSingle();
    if (!row) return errorState("That worksheet no longer exists.", values);
    if (row.status !== "draft") return errorState("Only a draft worksheet's questions can be replaced. Move it back to draft first.", values);
    worksheetSlug = row.slug as string;
    const q = questionsFrom(parsed.data.questions, worksheetSlug, row.title as string);
    if (q.error) return errorState(q.error, values);
    const { error } = await supabase.from("worksheets").update({ schema: q.schema }).eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err), values);
  }
  refresh(worksheetSlug);
  return okState("Questions loaded. Open the lesson as a member to check them before publishing.");
}
