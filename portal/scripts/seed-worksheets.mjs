#!/usr/bin/env node
// 09_IMPLEMENT_WORKSHEETS Slice E: seed the Module 1 worksheets as DRAFTS. Local and staging only.
//
//   node scripts/seed-worksheets.mjs            insert what is missing, change nothing that exists
//   node scripts/seed-worksheets.mjs --update   also refresh the schema of worksheets that are still draft
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Refuses unless the project allows sample content
// (app_config.allow_sample_content, which must never be true in production) and APP_ENV is not production.
// Prints no keys. An admin publishes the worksheets and milestones from the admin workspace afterwards.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "../src/domain/worksheets/fixtures");
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const update = process.argv.includes("--update");

if (!URL_ || !KEY) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
if (process.env.APP_ENV === "production") throw new Error("Refusing to seed: APP_ENV is production.");

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
async function api(method, path, body) {
  const r = await fetch(URL_ + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${path.split("?")[0]} ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

const cfg = await api("GET", "/rest/v1/app_config?key=eq.allow_sample_content&select=value");
if (cfg[0]?.value !== true) throw new Error("Refusing to seed: this project does not allow sample content (local and staging only).");

const read = (name) => JSON.parse(readFileSync(join(FIXTURES, name), "utf8"));
const SHEETS = [
  { file: "m1-l1-starting-point.json", lesson: 1 },
  { file: "m1-l2-business-direction.json", lesson: 2 },
  { file: "m1-l3-customer-research.json", lesson: 3 },
  { file: "m1-l9-foundation-blueprint.json", lesson: 9 },
];

const mod = (await api("GET", "/rest/v1/modules?number=eq.1&select=id,slug"))[0];
if (!mod) throw new Error("Module 1 not found.");
const lessons = await api("GET", `/rest/v1/lessons?module_id=eq.${mod.id}&select=id,slug,order_index,status`);

async function lessonAt(order) {
  const hit = lessons.find((l) => l.order_index === order);
  if (hit) return hit;
  if (order !== 9) throw new Error(`Module 1 has no lesson at position ${order}.`);
  // No Lesson 9 yet: add a SAMPLE lesson so the placeholder has a home (sample content cannot exist in production).
  const [created] = await api("POST", "/rest/v1/lessons", {
    module_id: mod.id,
    slug: "sample-lesson-9",
    order_index: 9,
    essential: true,
    title: "SAMPLE: Module 1 lesson 9",
    objective: "Placeholder objective. Real lesson content is pending production.",
    assignment: "Placeholder assignment. Real assignment is pending production.",
    is_sample: true,
    status: "published",
  });
  console.log("created SAMPLE: Module 1 lesson 9 (published sample, like lessons 1 to 7)");
  return created;
}

for (const { file, lesson } of SHEETS) {
  const schema = read(file);
  const target = await lessonAt(lesson);
  const existing = await api("GET", `/rest/v1/worksheets?slug=eq.${schema.slug}&version=eq.1&select=id,status`);
  if (!existing.length) {
    await api("POST", "/rest/v1/worksheets", { slug: schema.slug, version: 1, lesson_id: target.id, title: schema.title, schema, status: "draft" });
    console.log(`added ${schema.slug} as draft on Module 1 lesson ${lesson} (${target.slug})`);
  } else if (update && existing[0].status === "draft") {
    await api("PATCH", `/rest/v1/worksheets?id=eq.${existing[0].id}`, { lesson_id: target.id, title: schema.title, schema });
    console.log(`refreshed draft ${schema.slug}`);
  } else {
    console.log(`kept ${schema.slug} (${existing[0].status})`);
  }

  // The milestone that Complete ticks (completion.milestone_label), as a draft for the admin to publish.
  const label = schema.completion?.milestone_label;
  if (!label) continue;
  const have = await api("GET", `/rest/v1/milestones?module_id=eq.${mod.id}&select=id,title,order_index,status`);
  if (have.some((m) => m.title === label)) {
    console.log(`kept milestone "${label}"`);
    continue;
  }
  const slug = `worksheet-${schema.slug}`.slice(0, 80);
  const order = Math.max(0, ...have.map((m) => m.order_index)) + 1;
  await api("POST", "/rest/v1/milestones", { module_id: mod.id, slug, title: label, order_index: order, evidence_policy: "optional", status: "draft" });
  console.log(`added milestone "${label}" as draft`);
}
console.log("done. Publish the worksheets (Admin, Worksheets) and the milestones (Admin, Curriculum) when ready.");
