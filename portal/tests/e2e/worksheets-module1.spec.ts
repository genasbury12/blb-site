import { expect, test, type Page } from "@playwright/test";
import type { CallbackSource } from "../../src/domain/worksheets/callbacks";
import { validateAnswersPatch } from "../../src/domain/worksheets/schema";
import { completeWorksheet, exampleFor, expectCallbacks, loadSheet } from "./worksheet-fill";

/**
 * Module 1 worksheets on staging (Slice E, brief 11 and brief 18), with all nine seeded worksheets published for the run:
 *   E2E_M1_EMAIL / E2E_M1_PASSWORD               a new member with curriculum access, no audit and no worksheet answers
 *   E2E_M1_MODULE                                Module 1's slug
 *   E2E_M1_ADMIN_EMAIL / E2E_M1_ADMIN_PASSWORD   the shared staging test admin
 * Lessons 1 to 9 of Module 1 carry m1-l1-starting-point to m1-l9-foundation-blueprint. The member does Lesson 1, then
 * Lessons 2 to 9 in order with each schema's worked example, and every quote is checked against those answers.
 * Set up and tear down on staging with (logins go to a file outside the repository):
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite module1 --env-out /abs/path/module1-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite module1 --env-out /abs/path/module1-env.sh
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_M1_EMAIL);
test.skip(!enabled, "Set E2E_SUPABASE=1 and E2E_M1_* to run the Module 1 worksheet journey.");
test.describe.configure({ mode: "serial" });

// Which lesson carries each Module 1 worksheet for this run (the fixture uses the real lesson when the worksheet is
// attached to a published one, else a temporary lesson), and the number that lesson shows ("Complete Lesson 901").
const LESSONS = JSON.parse(process.env.E2E_M1_LESSONS ?? "{}") as Record<string, { path: string; number: number }>;
const lessonPath = (n: number) => LESSONS[n]!.path;
const num = (n: number) => LESSONS[n]!.number;
const Q3 = "Partly. I know who I want to help, not yet what they would pay for.";

let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await (await browser.newContext()).newPage();
  await page.goto(`/login?next=${encodeURIComponent("/app")}`);
  await page.getByLabel("Email").fill(process.env.E2E_M1_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_M1_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/app"));
});

/** Fill a field and wait until the autosave request carrying that exact value has been answered. */
async function fillAndSave(label: string | RegExp, value: string) {
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && (r.request().postData() ?? "").includes(JSON.stringify(value).slice(1, -1)), { timeout: 15_000 });
  await page.getByLabel(label).fill(value);
  await saved;
}

test("after the audit, an unfinished Lesson 1 worksheet becomes the dashboard's next step", async () => {
  test.setTimeout(180_000);
  // The audit comes first for a new member; finish it so the dashboard moves on.
  await page.goto("/app/audit", { waitUntil: "networkidle" });
  for (let q = 1; q <= 30; q++) {
    await expect(page.getByRole("heading", { name: new RegExp(`^Question ${q} of 30\\.`) })).toBeVisible();
    await page.getByRole("radio").nth(2).check();
    await page.getByRole("button", { name: /Next|Review answers/ }).click();
  }
  await page.getByRole("button", { name: "Submit my audit" }).click();
  await page.waitForURL(/\/app\/audit\/results\//);

  await page.goto(lessonPath(1), { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Your worksheet" })).toBeAttached();
  await fillAndSave(/^1\. What have you been treating/, "My blog posts and Pinterest.");

  await page.goto("/app", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: `Finish your Lesson ${num(1)} worksheet` })).toBeVisible();
  await page.getByRole("link", { name: /Open my worksheet/ }).click();
  await page.waitForURL((u) => u.pathname === lessonPath(1));
  await expect(page.getByLabel(/^1\. What have you been treating/)).toHaveValue("My blog posts and Pinterest.");
});

test("completing Lesson 1 ticks its milestone and clears the dashboard nudge", async () => {
  await page.getByLabel(/^2\. What do you ultimately want/).fill("A simple home system for busy parents.");
  await page.getByLabel(/^3\. If your blog disappeared/).fill(Q3);
  await page.getByLabel(/^4\. Your Biggest Realization/).fill("Start with the person and the problem.");
  // Clicked straight away, inside the autosave pause: Complete must send the last answers first.
  await page.getByRole("button", { name: `Complete Lesson ${num(1)}` }).click();
  await expect(page.getByText("Milestone ticked: I answered Lesson 1: Starting Point")).toBeVisible();
  await page.goto("/app", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /^Finish your Lesson \d+ worksheet$/ })).toHaveCount(0);
});

// ---- Lesson 3 (11_LESSON3_WORKSHEET) -----------------------------------------------------------------------------

const row = (group: string, k: number) => page.getByTestId(`row-${group}-${k}`);
const shot = async (name: string, locator?: ReturnType<Page["getByTestId"]>) => {
  if (!process.env.E2E_SHOTS) return;
  if (locator) await locator.screenshot({ path: `${process.env.E2E_SHOTS}/${name}.png` });
  else await page.screenshot({ path: `${process.env.E2E_SHOTS}/${name}.png`, fullPage: false });
};
test("Lesson 3 opens with a note while Lesson 2 is unfinished, shows five observation cards and adds more up to eight", async () => {
  await page.goto(lessonPath(3), { waitUntil: "networkidle" });
  await expect(page.getByTestId("callback-l2_hypothesis")).toContainText("You haven't finished your Lesson 2 worksheet yet.");
  // She can still work: the form is there and saves.
  await expect(page.getByTestId(/^row-evidence-\d$/)).toHaveCount(5);
  await expect(page.getByTestId(/^row-themes-\d$/)).toHaveCount(3);
  await shot("l3-top-missing");

  const add = page.getByRole("button", { name: "Add another observation" });
  await add.click();
  await expect(page.getByTestId(/^row-evidence-\d$/)).toHaveCount(6);
  await expect(row("evidence", 6).getByLabel("What she said or did")).toBeFocused();
  await add.click();
  await add.click();
  await expect(page.getByTestId(/^row-evidence-\d$/)).toHaveCount(8);
  await expect(add).toHaveCount(0);

  // Only rows with content come back after a reload: row 7 has an answer, so seven rows show.
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && (r.request().postData() ?? "").includes("ev_source_7"), { timeout: 15_000 });
  await row("evidence", 7).getByLabel("Source and date").fill("Survey reply, Nov 3");
  await saved;
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByTestId(/^row-evidence-\d$/)).toHaveCount(7);
  await expect(page.getByRole("button", { name: "Add another observation" })).toBeVisible();
});

// ---- Lessons 2 to 9 (brief 18) -------------------------------------------------------------------------------------

const L1_ANSWERS = { q1: "My blog posts and Pinterest.", q2: "A simple home system for busy parents.", q3: Q3, realization: "Start with the person and the problem." };
const SLUGS = ["", "m1-l1-starting-point", "m1-l2-business-direction", "m1-l3-customer-research", "m1-l4-problem-validation", "m1-l5-product-direction", "m1-l6-positioning", "m1-l7-messaging", "m1-l8-blog-to-buyer", "m1-l9-foundation-blueprint"];
const sources = new Map<string, CallbackSource>();
const quotes: Record<number, string[]> = {};

/** Lesson 2 has no worked example: these answers set up the hypothesis Lessons 3 and 9 quote. */
function lesson2Answers(schema: ReturnType<typeof loadSheet>["schema"]) {
  const r = (rating: string) => ({ rating, note: "Ten years of feeding my own picky eaters." });
  return validateAnswersPatch(schema, {
    idea_A: "Meal planning for parents of picky eaters",
    cred_A: r("strong"),
    need_A: r("uncertain"),
    fit_A: r("strong"),
    logic_A: r("uncertain"),
    assume_A: "That parents will pay for a plan rather than free recipes.",
    chosen: "A",
    hypothesis: { person: "parents of picky eaters", problem: "dinner battles", solution: "a weekly meal reset" },
    why: "Parents ask me about this every week.",
    assumption: "They will pay.",
    next_step: "Talk to five parents.",
    review_date: "2026-11-20",
  });
}

test("a member completes Lessons 2 to 9 in order with the worked examples, and every quote shows the right earlier answer", async () => {
  test.setTimeout(900_000);
  const l1 = loadSheet(SLUGS[1]!);
  sources.set(SLUGS[1]!, { title: l1.schema.title, schema: l1.schema, answers: L1_ANSWERS, status: "complete" });

  for (let n = 2; n <= 9; n++) {
    const slug = SLUGS[n]!;
    const { schema } = loadSheet(slug);
    const answers = n === 2 ? lesson2Answers(schema) : exampleFor(slug).answers;
    await page.goto(lessonPath(n), { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Your worksheet" })).toBeAttached();
    // Every quote from Lessons 1 to n-1, before she types anything.
    quotes[n] = await expectCallbacks(page, schema, sources);

    if (n === 3) {
      // Where you started: the Lesson 2 hypothesis, word for word.
      await expect(page.getByTestId("callback-l2_hypothesis")).toContainText("In Lesson 2 you wrote: I am exploring a business that helps parents of picky eaters solve dinner battles through a weekly meal reset.");
    }
    if (n === 4) {
      // Lesson 3's problems are copied in as the starting point, and the scorecard is one grid.
      const l3 = sources.get(SLUGS[3]!)!.answers;
      for (const k of ["1", "2", "3"]) await expect(page.locator(`[data-field="problem_${k}"]`)).toHaveValue(l3[`theme_${k}`] as string);
      await expect(page.getByTestId("matrix-problems")).toBeVisible();
    }
    if (n === 9) {
      await expect(page.getByTestId("decision-1")).toBeVisible();
      await expect(page.getByTestId("toggle-existing")).toHaveAttribute("aria-expanded", "false");
    }

    sources.set(slug, await completeWorksheet(page, num(n), schema, answers));
    const label = schema.completion.milestone_label;
    if (label) await expect(page.getByText(`Milestone ticked: ${label}`)).toBeVisible();
    if (n === 3) await expect(page.getByTestId("guide-ev_conf_1")).toHaveText("One or two people said or did this.");
    if (n === 4) await shot("l4-grid", page.getByTestId("matrix-problems"));
    if (n === 5) await shot("l5-top", page.getByTestId("callback-l4_priority_problem"));
    if (n === 9) {
      await shot("l9-decision-3", page.getByTestId("decision-3"));
      await shot("l9-where-you-started", page.getByTestId("section-started"));
    }
  }
  // Lesson 9 quotes all of Lessons 1 to 8.
  expect(quotes[9]!.length).toBeGreaterThanOrEqual(14);
});

test("the Lesson 9 Blueprint PDF and the Download all Module 1 worksheets bundle", async () => {
  await page.goto(lessonPath(9), { waitUntil: "networkidle" });
  const pdf = await page.request.get("/api/worksheets/m1-l9-foundation-blueprint/pdf");
  expect(pdf.status()).toBe(200);
  const one = await pdf.body();
  expect(one.subarray(0, 5).toString()).toBe("%PDF-");
  const all = page.getByRole("link", { name: /Download all Module 1 worksheets/ });
  await expect(all).toBeVisible();
  const bundle = await page.request.get((await all.getAttribute("href"))!);
  expect(bundle.status()).toBe(200);
  const many = await bundle.body();
  expect(many.subarray(0, 5).toString()).toBe("%PDF-");
  // Nine completed worksheets: the bundle is several times the size of the Blueprint alone.
  expect(many.length).toBeGreaterThan(one.length * 3);
  const pages = (b: Buffer) => (b.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  expect(pages(many)).toBeGreaterThan(pages(one) + 8);
  if (process.env.E2E_SHOTS) {
    const fs = await import("node:fs");
    fs.writeFileSync(`${process.env.E2E_SHOTS}/lesson9-blueprint.pdf`, one);
    fs.writeFileSync(`${process.env.E2E_SHOTS}/module1-all.pdf`, many);
  }
});

test("the admin worksheet page counts observations and tallies confidence; the CSV lists ticked rows as 1, 2", async ({ browser }) => {
  const admin = await (await browser.newContext()).newPage();
  await admin.goto(`/login?next=${encodeURIComponent("/admin/worksheets/m1-l3-customer-research")}`);
  await admin.getByLabel("Email").fill(process.env.E2E_M1_ADMIN_EMAIL!);
  await admin.getByLabel("Password").fill(process.env.E2E_M1_ADMIN_PASSWORD!);
  await admin.getByRole("button", { name: "Sign in" }).click();
  await admin.waitForURL((u) => u.pathname.startsWith("/admin"));
  await admin.goto("/admin/worksheets/m1-l3-customer-research", { waitUntil: "networkidle" });
  const tiles = admin.getByTestId("ws-admin-count");
  await expect(tiles).toHaveCount(2);
  await expect(tiles.nth(0)).toContainText("Observations logged");
  await expect(tiles.nth(1)).toContainText("Confidence: hypothesis / observed / confirmed");
  // This member: five observations; hypothesis 1, observed 3, confirmed 1. Other staging answers may add to it.
  await expect(tiles.nth(0)).toContainText(/\d+/);
  await expect(tiles.nth(1)).toContainText(/Hypothesis \d+, Observed \d+, Confirmed \d+/);
  if (process.env.E2E_SHOTS) await admin.locator("main").screenshot({ path: `${process.env.E2E_SHOTS}/l3-admin.png` });

  const csv = await (await admin.request.get("/api/admin/worksheets/m1-l3-customer-research/csv")).text();
  const lines = csv.split("\r\n");
  const header = lines.find((l) => l.startsWith("name,"))!.split(",");
  const mine = lines.find((l) => l.startsWith("STAGING TEST module one"))!;
  expect(header).toEqual(expect.arrayContaining(["ev_said_8", "ev_conf_1", "theme_rows_1"]));
  expect(mine).toContain('"1, 2"');
  expect(mine).toContain('"4, 5"');
  await admin.context().close();
});
