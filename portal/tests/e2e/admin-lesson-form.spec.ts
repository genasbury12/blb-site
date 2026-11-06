import { expect, test, type Page } from "@playwright/test";

/**
 * Admin lesson and worksheet management on staging: a save that hits a unique constraint names the lesson already
 * there and no field is wiped; worksheets are attached, moved and detached from either side with a warning first;
 * new worksheets are created; lessons move up and down; lessons are deleted (simple confirm, or the typed title when
 * members have data), their worksheet detached and kept. Set up and tear down with
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite catalog --env-out /abs/path/catalog-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite catalog --env-out /abs/path/catalog-env.sh
 * E2E_CAT_ADMIN_EMAIL / _PASSWORD   the shared staging test admin
 * E2E_CAT_MODULE_ID                 Module 2's id
 * E2E_CAT_LESSONS                   the temporary lessons a, b, c (samples) and real (a member has data on it)
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_CAT_ADMIN_EMAIL);
test.skip(!enabled, "Set E2E_SUPABASE=1 and E2E_CAT_* to run the admin lesson form test.");
test.describe.configure({ mode: "serial" });

type Lesson = { id: string; slug: string; title: string; order_index: number };
const L = JSON.parse(process.env.E2E_CAT_LESSONS ?? "{}") as Record<"a" | "b" | "c" | "real", Lesson>;
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
const status = () => lessonForm().getByTestId("form-status");

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
  await input("order_index").fill(String(L.a.order_index));
  await fillAll(FIELDS);
  await input("essential").uncheck();
  await input("captions_ready").check();
  await page.getByRole("button", { name: "Create draft lesson" }).click();

  await expect(status()).toContainText(
    `Position ${L.a.order_index} in this module is taken by "${L.a.title}".`,
  );
  await expectKept(FIELDS, String(L.a.order_index), { essential: false, captions_ready: true });
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
  const edited = { ...FIELDS, slug: L.b.slug, video_provider_id: "StagingTestPlayback0456", transcript: `${TRANSCRIPT}\nOne more line added while editing.` };
  await fillAll(edited);
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText(`That slug is already used by "${L.b.title}" in this module.`);
  await expectKept(edited, "77", { essential: false, captions_ready: true });

  // Slug fixed, position now taken.
  const second = { ...edited, slug: SLUG };
  await fillAll(second);
  await input("order_index").fill(String(L.b.order_index));
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText(`Position ${L.b.order_index} in this module is taken by "${L.b.title}".`);
  await expectKept(second, String(L.b.order_index), { essential: false, captions_ready: true });
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

test("a position past 99 saves, and an impossible one says why in the page", async () => {
  await page.goto(editPath, { waitUntil: "networkidle" });
  await input("order_index").fill("1000");
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText("Use a position from 1 to 999.");
  await input("order_index").fill("777");
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText("Lesson saved.");
  await page.reload({ waitUntil: "networkidle" });
  await expect(input("order_index")).toHaveValue("777");
});

// ---- worksheets on lessons ---------------------------------------------------------------------------------------

const picker = () => page.locator("select#worksheet_slug").filter({ visible: true });
const warning = () => page.getByTestId("attach-warning").filter({ visible: true });

test("lesson page: pick a worksheet from another lesson; the warning names that lesson; save moves it; None detaches it", async () => {
  await page.goto(`/admin/catalog/lessons/${L.b.id}`, { waitUntil: "networkidle" });
  await expect(picker()).toHaveValue("");
  await expect(picker().locator("option", { hasText: "STAGING TEST worksheet to move" })).toContainText(`on Module 2, Lesson ${L.a.order_index}: ${L.a.title}`);
  await picker().selectOption("staging-test-ws-move");
  await expect(warning()).toHaveText(`This will remove it from "${L.a.title}".`);
  if (process.env.E2E_SHOTS) await lessonForm().locator("select#worksheet_slug").locator("..").screenshot({ path: `${process.env.E2E_SHOTS}/lesson-picker-warning.png` });
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText("Lesson saved. Worksheet attached.");
  await page.goto("/admin/worksheets/staging-test-ws-move", { waitUntil: "networkidle" });
  await expect(page.getByText(`Module 2, Lesson ${L.b.order_index}: ${L.b.title}`).first()).toBeVisible();

  await page.goto(`/admin/catalog/lessons/${L.b.id}`, { waitUntil: "networkidle" });
  await expect(picker()).toHaveValue("staging-test-ws-move");
  await picker().selectOption("");
  await expect(warning()).toContainText('"STAGING TEST worksheet to move" will be detached from this lesson');
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(status()).toContainText("Lesson saved. Worksheet detached.");
  await page.goto("/admin/worksheets", { waitUntil: "networkidle" });
  await expect(page.getByRole("row", { name: /STAGING TEST worksheet to move/ })).toContainText("Not attached");
});

test("worksheet page: move it onto a lesson (grouped by module), and onto one that has a worksheet with a warning", async () => {
  await page.goto("/admin/worksheets/staging-test-ws-move", { waitUntil: "networkidle" });
  const lessonSelect = page.locator("select#lesson_id").filter({ visible: true });
  await expect(lessonSelect.locator('optgroup[label^="Module 2"] option', { hasText: L.a.title })).toHaveCount(1);
  // From nowhere onto an empty lesson: nothing to warn about.
  await lessonSelect.selectOption(L.a.id);
  await expect(page.getByTestId("attach-warning").filter({ visible: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(page.getByText("Worksheet attached.")).toBeVisible();
  await expect(page.getByText(`Module 2, Lesson ${L.a.order_index}: ${L.a.title}`).first()).toBeVisible();

  // The real lesson already carries "STAGING TEST worksheet kept".
  await lessonSelect.selectOption(L.real.id);
  await expect(warning()).toHaveText(`This will remove it from "${L.a.title}". "STAGING TEST worksheet kept" will be detached from "${L.real.title}".`);
  if (process.env.E2E_SHOTS) await page.locator("form", { has: lessonSelect }).screenshot({ path: `${process.env.E2E_SHOTS}/worksheet-picker-warning.png` });
  // Not saved: put it back on a for the rest of the run.
  await lessonSelect.selectOption(L.a.id);
});

test("New worksheet: create the record, attach it, see that it has no questions and cannot be published, then load questions", async () => {
  const slug = `staging-test-ws-new-${Date.now().toString(36)}`;
  await page.goto("/admin/worksheets", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "New worksheet" }).click();
  await page.waitForURL(/\/admin\/worksheets\/new$/);
  await page.getByLabel("Title").fill("STAGING TEST new worksheet");
  await page.getByLabel("Slug").fill(slug);
  await page.locator("select#lesson_id").selectOption(L.c.id);
  await page.getByRole("button", { name: "Create draft worksheet" }).click();
  await page.waitForURL(new RegExp(`/admin/worksheets/${slug}\\?created=1`));
  await expect(page.getByText("Worksheet created as a draft.")).toBeVisible();
  await expect(page.getByTestId("no-questions")).toContainText("no questions yet");
  await expect(page.getByText(`Module 2, Lesson ${L.c.order_index}: ${L.c.title}`).first()).toBeVisible();
  // It cannot be published without questions.
  await page.getByRole("button", { name: "Send for review" }).click();
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("This worksheet has no questions yet. Add its questions before publishing.")).toBeVisible();
  await page.getByRole("button", { name: "Return to draft" }).click();
  await expect(page.getByRole("button", { name: "Load questions" })).toBeVisible();
  const schema = { title: "New", intro: { title: "New" }, sections: [{ key: "s", title: "Questions", fields: [{ key: "q1", type: "textarea", label: "What changed?", max_length: 500 }] }], completion: { required_fields: ["q1"] } };
  await page.getByLabel("Paste a schema file").fill(JSON.stringify(schema));
  await page.getByRole("button", { name: "Load questions" }).click();
  await expect(page.getByText("Questions loaded.")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("1 question.")).toBeVisible();
});

// ---- order and delete --------------------------------------------------------------------------------------------

test("Curriculum: up and down swap two lessons without a position error", async () => {
  await page.goto("/admin/catalog", { waitUntil: "networkidle" });
  const rowA = page.getByTestId(`lesson-row-${L.a.id}`);
  await expect(rowA).toContainText(String(L.a.order_index));
  await page.getByTestId(`down-${L.a.id}`).click();
  await expect(rowA).toContainText(String(L.b.order_index));
  await expect(page.getByTestId(`lesson-row-${L.b.id}`)).toContainText(String(L.a.order_index));
  await page.getByTestId(`up-${L.a.id}`).click();
  await expect(rowA).toContainText(String(L.a.order_index));
});

test("delete a sample lesson: one confirm, its worksheet detached and kept, its position free at once", async () => {
  await page.goto(`/admin/catalog/lessons/${L.c.id}`, { waitUntil: "networkidle" });
  await page.getByTestId("delete-lesson").click();
  const dialog = page.getByRole("dialog", { name: "Delete this lesson?" });
  await expect(dialog).toContainText(L.c.title);
  await expect(dialog.getByTestId("delete-counts")).toContainText("0 members have progress on it.");
  await expect(dialog).not.toContainText("Type its title");
  await dialog.getByRole("button", { name: "Delete lesson" }).click();
  await page.waitForURL(/\/admin\/catalog\?notice=/);
  await expect(page.getByTestId("catalog-notice")).toContainText(`Deleted "${L.c.title}". Worksheet "STAGING TEST new worksheet" detached and kept, with its answers.`);
  await expect(page.getByTestId(`lesson-row-${L.c.id}`)).toHaveCount(0);
});

test("delete a real lesson with member data: counts shown, CSV offered, title typed; the answers stay", async () => {
  await page.goto(`/admin/catalog/lessons/${L.real.id}`, { waitUntil: "networkidle" });
  await page.getByTestId("delete-lesson").click();
  const dialog = page.getByRole("dialog", { name: "Delete this lesson?" });
  await expect(dialog.getByTestId("delete-counts")).toContainText("1 member has progress on it.");
  await expect(dialog.getByTestId("delete-counts")).toContainText("1 worksheet answer is tied to it.");
  await expect(dialog.getByRole("link", { name: /Export answers as CSV first/ })).toHaveAttribute("href", "/api/admin/worksheets/staging-test-ws-kept/csv");
  const go = dialog.getByRole("button", { name: "Delete lesson" });
  await expect(go).toBeDisabled();
  await dialog.getByLabel(/Type its title to confirm/).fill("not the title");
  await expect(go).toBeDisabled();
  await dialog.getByLabel(/Type its title to confirm/).fill(L.real.title);
  if (process.env.E2E_SHOTS) await dialog.screenshot({ path: `${process.env.E2E_SHOTS}/delete-typed.png` });
  await go.click();
  await page.waitForURL(/\/admin\/catalog\?notice=/);
  await expect(page.getByTestId("catalog-notice")).toContainText(`Deleted "${L.real.title}".`);
  await expect(page.getByTestId("catalog-notice")).toContainText("Also removed 1 progress record.");
  // The worksheet and its answer are still there, attached to nothing.
  await page.goto("/admin/worksheets", { waitUntil: "networkidle" });
  const row = page.getByRole("row", { name: /STAGING TEST worksheet kept/ });
  await expect(row).toContainText("Not attached");
  await expect(row.getByTestId("started-staging-test-ws-kept")).toHaveText("1");
});
