import { expect, test, type Page } from "@playwright/test";

/**
 * 09_IMPLEMENT_WORKSHEETS Slice E exit test, on staging with the seeded Module 1 worksheets published for the run:
 *   E2E_M1_EMAIL / E2E_M1_PASSWORD   a new member with curriculum access, no audit and no worksheet answers
 *   E2E_M1_MODULE                    Module 1's slug
 * Lessons 1, 2 and 9 of Module 1 carry m1-l1-starting-point, m1-l2-business-direction and the Lesson 9 placeholder.
 * Set up and tear down on staging with (logins go to a file outside the repository):
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite module1 --env-out /abs/path/module1-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite module1 --env-out /abs/path/module1-env.sh
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_M1_EMAIL);
test.skip(!enabled, "Set E2E_SUPABASE=1 and E2E_M1_* to run the Module 1 worksheet journey.");
test.describe.configure({ mode: "serial" });

const lessonPath = (n: number) => `/app/training/${process.env.E2E_M1_MODULE}/sample-lesson-${n}`;
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
  await expect(page.getByRole("heading", { name: "Finish your Lesson 1 worksheet" })).toBeVisible();
  await page.getByRole("link", { name: /Open my worksheet/ }).click();
  await page.waitForURL((u) => u.pathname === lessonPath(1));
  await expect(page.getByLabel(/^1\. What have you been treating/)).toHaveValue("My blog posts and Pinterest.");
});

test("completing Lesson 1 ticks its milestone and clears the dashboard nudge", async () => {
  await page.getByLabel(/^2\. What do you ultimately want/).fill("A simple home system for busy parents.");
  await page.getByLabel(/^3\. If your blog disappeared/).fill(Q3);
  await page.getByLabel(/^4\. Your Biggest Realization/).fill("Start with the person and the problem.");
  // Clicked straight away, inside the autosave pause: Complete must send the last answers first.
  await page.getByRole("button", { name: "Complete Lesson 1" }).click();
  await expect(page.getByText("Milestone ticked: I answered Lesson 1: Starting Point")).toBeVisible();
  await page.goto("/app", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: /^Finish your Lesson \d+ worksheet$/ })).toHaveCount(0);
});

test("the Lesson 9 placeholder quotes the member's own Lesson 1 and 2 answers and offers the module PDF", async () => {
  // Before Lesson 2 is answered, its look back shows a gentle note instead.
  await page.goto(lessonPath(9), { waitUntil: "networkidle" });
  await expect(page.getByTestId("callback-look_back_l1")).toContainText(Q3);
  await expect(page.getByTestId("callback-look_back_l2")).toContainText("will show here once you fill it in");
  await expect(page.getByRole("button", { name: /Complete Lesson/ })).toHaveCount(0);

  await page.goto(lessonPath(2), { waitUntil: "networkidle" });
  await page.getByLabel("My hypothesis: person").fill("busy parents");
  await page.getByLabel("My hypothesis: problem").fill("cluttered homes");
  await fillAndSave("My hypothesis: type of solution", "a weekly reset plan");
  await page.goto("/app", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Finish your Lesson 2 worksheet" })).toBeVisible();

  await page.goto(lessonPath(9), { waitUntil: "networkidle" });
  await expect(page.getByTestId("callback-look_back_l2")).toContainText("I am exploring a business that helps busy parents solve cluttered homes through a weekly reset plan.");
  const all = page.getByRole("link", { name: /Download all Module 1 worksheets/ });
  await expect(all).toBeVisible();
  const pdf = await page.request.get((await all.getAttribute("href"))!);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});

// ---- Lesson 3 (11_LESSON3_WORKSHEET) -----------------------------------------------------------------------------

const row = (group: string, k: number) => page.getByTestId(`row-${group}-${k}`);
const shot = async (name: string, locator?: ReturnType<Page["getByTestId"]>) => {
  if (!process.env.E2E_SHOTS) return;
  if (locator) await locator.screenshot({ path: `${process.env.E2E_SHOTS}/${name}.png` });
  else await page.screenshot({ path: `${process.env.E2E_SHOTS}/${name}.png`, fullPage: false });
};
const SAID_1 = "\"I keep buying groceries and still order takeout, every single week, and I hate it.\"";
const OBSERVATIONS = [
  [SAID_1, "Conversation with a friend, Nov 2", "Planning friction, or an unpredictable schedule.", "Walk me through the last time that happened.", "Observed"],
  ["\"By 5pm I can't make one more decision.\"", "Reply to my story question, Oct 30", "Decision fatigue may matter more than variety.", "What makes dinner hard on your busiest day?", "Observed"],
  ["\"My four-year-old eats five things. Five.\"", "Public group thread, Oct 28", "Picky eating may be the real constraint.", "What happens when you cook outside the five?", "Confirmed"],
  ["\"I throw out half the produce I buy.\"", "Same thread, different parent, Oct 28", "Waste is the pain she feels.", "What did you try to fix that?", "Hypothesis"],
  ["\"I bought a meal plan PDF and used it for one week.\"", "Conversation with a coworker, Nov 1", "She will pay; a static plan does not stick.", "What happened in week two?", "Observed"],
] as const;

async function fillObservation(k: number, [said, source, meaning, question, conf]: readonly string[]) {
  const r = row("evidence", k);
  await r.getByLabel("What she said or did").fill(said!);
  await r.getByLabel("Source and date").fill(source!);
  await r.getByLabel("What it might mean").fill(meaning!);
  await r.getByLabel("The question I'd ask next").fill(question!);
  await r.getByRole("radiogroup", { name: "Confidence" }).getByText(conf!, { exact: true }).click();
}

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

test("Lesson 3: confidence chips, ticking supporting observations, and completing ticks the milestone", async () => {
  test.setTimeout(180_000);
  await page.goto(lessonPath(3), { waitUntil: "networkidle" });
  const supports1 = row("themes", 1).getByRole("group", { name: /Supported by observations/ });
  // Row 7 has content (a source), so it is offered, without words yet.
  await expect(supports1.getByRole("checkbox")).toHaveCount(1);

  await fillObservation(1, OBSERVATIONS[0]!);
  await expect(page.getByTestId("guide-ev_conf_1")).toHaveText("One or two people said or did this.");
  // The option shows the first 60 characters of what she said.
  const label1 = `Observation 1: ${SAID_1.slice(0, 60).trimEnd()}…`;
  await expect(supports1.getByRole("checkbox", { name: label1 })).toBeVisible();
  for (let k = 2; k <= 5; k++) await fillObservation(k, OBSERVATIONS[k - 1]!);
  await expect(supports1.getByRole("checkbox")).toHaveCount(6);
  await shot("l3-observation-card", row("evidence", 1));

  const themes = [
    ["Deciding what to cook is harder than cooking it", [1, 2]],
    ["Any plan has to survive a picky four-year-old", [3]],
    ["Static plans get abandoned in a week", [4, 5]],
  ] as const;
  for (const [i, [text, rows]] of themes.entries()) {
    const r = row("themes", i + 1);
    await r.getByRole("textbox", { name: `Problem ${i + 1}` }).fill(text);
    for (const k of rows) await r.getByRole("checkbox", { name: new RegExp(`^Observation ${k}:`) }).check();
  }
  await shot("l3-themes", page.getByTestId("rows-themes"));

  await page.getByLabel(/^Her current situation/).fill("Two kids under six, works until 5.");
  await page.getByLabel(/^The trigger moment/).fill("Threw out spinach again and ordered pizza.");
  await page.getByLabel(/^The result she wants/).fill("To know what dinner is before 5pm.");
  await page.getByLabel(/^What she's already tried/).fill("A meal plan PDF, a recipe app.");
  await page.getByLabel(/^Her practical constraints/).fill("Fifteen minutes on Sunday.");
  await page.getByLabel(/^What would stop her buying/).fill("Another PDF she will not use.");
  await page.getByLabel(/^Her words/).fill("\"Eats five things.\" \"Used it for one week.\"");
  await page.getByLabel("In one sentence: situation").fill("two picky kids and no decisions left by 5pm");
  await page.getByLabel("In one sentence: result").fill("dinner decided before she is tired");
  await page.getByLabel("In one sentence: barrier").fill("buying one more plan she abandons");
  await page.getByLabel(/^The first-offer audience/).fill("Parents of picky eaters under six.");
  await page.getByLabel(/^One thing this research changes/).fill("It has to fit in fifteen minutes.");
  await page.getByLabel(/^What I still don't know/).fill("Whether she would pay monthly.");
  await page.getByLabel(/^My next validation step/).fill("Ask the five people the week two question.");
  await page.getByLabel(/^I'll have done it by/).fill("2026-11-15");

  await expect(page.getByTestId("worksheet-progress")).toHaveText("100% complete");
  await page.getByRole("button", { name: "Complete Lesson 3" }).click();
  await expect(page.getByText("Milestone ticked: I built a buyer snapshot from real evidence")).toBeVisible();

  // The ticks survive a reload, in row order.
  await page.reload({ waitUntil: "networkidle" });
  await expect(row("themes", 1).getByRole("checkbox", { checked: true })).toHaveCount(2);
  await expect(row("evidence", 3).getByRole("radio", { name: /^Confirmed/ })).toBeChecked();
});

test("once Lesson 2 is complete, Lesson 3 quotes its hypothesis under Where you started, and the PDF downloads", async () => {
  test.setTimeout(180_000);
  await page.goto(lessonPath(2), { waitUntil: "networkidle" });
  const idea = "Weekly reset plans for busy parents";
  await page.getByRole("textbox", { name: /^Idea A/ }).fill(idea);
  for (const t of ["Credibility", "Buyer need", "Delivery fit", "Commercial logic"]) {
    const group = page.getByRole("radiogroup", { name: `${t} for ${idea}` });
    await group.getByText("Uncertain", { exact: true }).click();
    await page.getByLabel(`Why, for ${t} for ${idea}`).fill("Not checked yet.");
  }
  await page.getByLabel(`What I'm assuming for ${idea}`).fill("That they will pay.");
  await page.getByRole("radiogroup", { name: "I'm testing" }).getByText(idea).click();
  await page.getByLabel(/^Why this one/).fill("People ask me about it.");
  await page.getByLabel(/^My biggest unchecked assumption/).fill("They will pay.");
  await page.getByLabel(/^One thing I'll do this week/).fill("Talk to five parents.");
  await page.getByLabel(/^I'll review the evidence on/).fill("2026-12-01");
  await expect(page.getByTestId("worksheet-progress")).toHaveText("100% complete");
  await page.getByRole("button", { name: "Complete Lesson 2" }).click();
  await expect(page.getByText(/^Lesson 2 complete$/)).toBeVisible();

  await page.goto(lessonPath(3), { waitUntil: "networkidle" });
  const quote = page.getByTestId("callback-l2_hypothesis");
  await expect(quote).toContainText("Where you started");
  await expect(quote).toContainText("In Lesson 2 you wrote: I am exploring a business that helps busy parents solve cluttered homes through a weekly reset plan.");
  await quote.scrollIntoViewIfNeeded();
  await shot("l3-where-you-started");

  const pdf = await page.request.get("/api/worksheets/m1-l3-customer-research/pdf");
  expect(pdf.status()).toBe(200);
  const body = await pdf.body();
  expect(body.subarray(0, 5).toString()).toBe("%PDF-");
  if (process.env.E2E_SHOTS) (await import("node:fs")).writeFileSync(`${process.env.E2E_SHOTS}/lesson3.pdf`, body);
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
