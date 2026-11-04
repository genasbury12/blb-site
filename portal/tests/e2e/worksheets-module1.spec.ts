import { expect, test, type Page } from "@playwright/test";

/**
 * 09_IMPLEMENT_WORKSHEETS Slice E exit test, on staging with the seeded Module 1 worksheets published for the run:
 *   E2E_M1_EMAIL / E2E_M1_PASSWORD   a new member with curriculum access, no audit and no worksheet answers
 *   E2E_M1_MODULE                    Module 1's slug
 * Lessons 1, 2 and 9 of Module 1 carry m1-l1-starting-point, m1-l2-business-direction and the Lesson 9 placeholder.
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
