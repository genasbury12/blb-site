import { expect, test, type Page } from "@playwright/test";

/**
 * Admin lesson forms (new and edit): a save that hits a unique constraint names the lesson already there, and no
 * field is wiped. On staging, set up and tear down with
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite catalog --env-out /abs/path/catalog-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite catalog --env-out /abs/path/catalog-env.sh
 * E2E_CAT_ADMIN_EMAIL / _PASSWORD   the shared staging test admin
 * E2E_CAT_MODULE_ID                 Module 2's id; E2E_CAT_TITLE_1 / _2 and E2E_CAT_SLUG_2 its lessons at positions 1 and 2
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_CAT_ADMIN_EMAIL);
test.skip(!enabled, "Set E2E_SUPABASE=1 and E2E_CAT_* to run the admin lesson form test.");
test.describe.configure({ mode: "serial" });

const SLUG = `staging-test-lesson-${Date.now().toString(36)}`;
// Long on purpose: a transcript is the field that hurts most to lose.
const TRANSCRIPT = Array.from({ length: 120 }, (_, i) => `Line ${i + 1}. In this lesson we look at who the blog is really for and what she would pay for.`).join("\n");

const FIELDS = {
  title: "STAGING TEST lesson form",
  slug: SLUG,
  duration_minutes: "7.5",
  objective: "Know who the blog is for.",
  assignment: "Write one sentence about her.",
  video_provider_id: "StagingTestPlayback0123",
  transcript: TRANSCRIPT,
  ai_prompt: "Help me describe my reader in one sentence.",
  ai_assistant_url: "https://claude.ai/project/staging-test",
  path_note_build: "Start here if you have no blog yet.",
  path_note_optimize: "Start here if your blog already has readers.",
};

let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await (await browser.newContext()).newPage();
  await page.goto(`/login?next=${encodeURIComponent("/admin/catalog")}`);
  await page.getByLabel("Email").fill(process.env.E2E_CAT_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_CAT_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin"));
});

// The edit page has other forms too (status, resources, suggestions): everything is looked up in the lesson form.
// Next keeps the page you came from mounted but hidden, so only the visible lesson form counts.
const lessonForm = () => page.locator("form", { has: page.locator('[name="transcript"]') }).filter({ visible: true });
const input = (name: string) => lessonForm().locator(`[name="${name}"]`);
const status = () => lessonForm().locator("[aria-live=polite]");

async function fillAll(values: Record<string, string>) {
  for (const [name, v] of Object.entries(values)) await input(name).fill(v);
}

/** Every field still shows what was typed. */
async function expectKept(values: Record<string, string>, order: string, boxes: { essential: boolean; captions_ready: boolean }) {
  for (const [name, v] of Object.entries(values)) await expect(input(name), name).toHaveValue(v);
  await expect(input("order_index")).toHaveValue(order);
  await expect(input("module_id")).toHaveValue(process.env.E2E_CAT_MODULE_ID!);
  await expect(input("essential")).toBeChecked({ checked: boxes.essential });
  await expect(input("captions_ready")).toBeChecked({ checked: boxes.captions_ready });
}

let editPath = "";

test("new lesson in a taken position: the error names the lesson there and every field is kept", async () => {
  await page.goto(`/admin/catalog/lessons/new?module=${process.env.E2E_CAT_MODULE_ID}`, { waitUntil: "networkidle" });
  await input("order_index").fill("1");
  await fillAll(FIELDS);
  await input("essential").uncheck();
  await input("captions_ready").check();
  await page.getByRole("button", { name: "Create draft lesson" }).click();

  await expect(status()).toContainText(
    `Position 1 in this module is taken by "${process.env.E2E_CAT_TITLE_1}".`,
  );
  await expectKept(FIELDS, "1", { essential: false, captions_ready: true });
  if (process.env.E2E_SHOTS) await page.locator("main").screenshot({ path: `${process.env.E2E_SHOTS}/lesson-new-conflict.png` });

  // Pick a free position and the same form saves.
  await input("order_index").fill("77");
  await page.getByRole("button", { name: "Create draft lesson" }).click();
  await page.waitForURL(/\/admin\/catalog\/lessons\/[0-9a-f-]{36}\?created=1/);
  await expect(page.getByText("Draft created.")).toBeVisible();
  editPath = new URL(page.url()).pathname;
  await expectKept(FIELDS, "77", { essential: false, captions_ready: true });
});

test("editing a lesson onto a used slug or position: each names the other lesson and keeps the edits", async () => {
  await page.goto(editPath, { waitUntil: "networkidle" });
  const edited = { ...FIELDS, slug: process.env.E2E_CAT_SLUG_2!, video_provider_id: "StagingTestPlayback0456", transcript: `${TRANSCRIPT}\nOne more line added while editing.` };
  await fillAll(edited);
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText(`That slug is already used by "${process.env.E2E_CAT_TITLE_2}" in this module.`);
  await expectKept(edited, "77", { essential: false, captions_ready: true });

  // Slug fixed, position now taken.
  const second = { ...edited, slug: SLUG };
  await fillAll(second);
  await input("order_index").fill("2");
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText(`Position 2 in this module is taken by "${process.env.E2E_CAT_TITLE_2}".`);
  await expectKept(second, "2", { essential: false, captions_ready: true });
  if (process.env.E2E_SHOTS) await page.locator("main").screenshot({ path: `${process.env.E2E_SHOTS}/lesson-edit-conflict.png` });

  // Back to a free position: it saves, and a fresh load shows the edits stored.
  await input("order_index").fill("77");
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText("Lesson saved.");
  await page.reload({ waitUntil: "networkidle" });
  await expectKept(second, "77", { essential: false, captions_ready: true });
});

test("a form check that fails before saving also keeps every field", async () => {
  await page.goto(editPath, { waitUntil: "networkidle" });
  // Passes the browser's own check (it is a URL) but not the server's (it must be https).
  const bad = { ...FIELDS, ai_assistant_url: "http://claude.ai/project/staging-test" };
  await fillAll(bad);
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText("Use an https link.");
  await expectKept(bad, "77", { essential: false, captions_ready: true });
});
