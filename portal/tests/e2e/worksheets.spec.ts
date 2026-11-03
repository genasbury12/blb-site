import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * 09_IMPLEMENT_WORKSHEETS Slice B exit test. Skipped unless E2E_SUPABASE=1 and a worksheet test member is given:
 *   E2E_WS_EMAIL / E2E_WS_PASSWORD   a member with curriculum access and no saved worksheet answers
 *   E2E_WS_LESSON_PATH               lesson page whose published worksheet uses the m1-l2-business-direction schema
 *   E2E_WS_CALLBACK_PATH             lesson page whose worksheet has a callback to that worksheet's hypothesis
 * Writes the member's own answers; run against staging with a temporary member.
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_WS_EMAIL);
test.skip(!enabled, "Set E2E_SUPABASE=1 and E2E_WS_* to run the worksheet journey.");
test.describe.configure({ mode: "serial" });

const IDEA = "Meal planning for parents of picky eaters";
const RATINGS: [string, "Strong" | "Uncertain" | "Weak", string][] = [
  ["Credibility", "Strong", "Ten years as a pediatric dietitian."],
  ["Buyer need", "Uncertain", "Parents ask me this weekly, not yet checked who pays."],
  ["Delivery fit", "Weak", "Only two hours on Tuesdays."],
  ["Commercial logic", "Strong", "A weekly plan that saves an hour of arguing."],
];

async function signIn(page: Page, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(process.env.E2E_WS_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_WS_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/app"));
  await page.goto(next, { waitUntil: "networkidle" });
}

async function newDevice(browser: Browser, next: string) {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, next);
  return page;
}

const status = (page: Page) => page.getByTestId("worksheet-save-status");
const progress = (page: Page) => page.getByTestId("worksheet-progress");

test("fill, autosave, rate, write the hypothesis, complete; answers survive a reload on another device", async ({ browser }) => {
  test.setTimeout(240_000);
  const path = process.env.E2E_WS_LESSON_PATH!;
  const page = await newDevice(browser, path);
  await expect(page.getByRole("heading", { name: "Your worksheet" })).toBeVisible();
  await expect(progress(page)).toHaveText("0% complete");
  await expect(page.getByRole("button", { name: /Complete Lesson/ })).toBeDisabled();

  await page.getByRole("textbox", { name: /^Idea A/ }).fill(IDEA);
  await expect(status(page)).toHaveText(/^Saved \d/, { timeout: 15_000 });
  await expect(progress(page)).toHaveText("8% complete");
  // The repeat column heading now shows the idea text instead of "Idea A".
  await expect(page.getByTestId("col-cred_A")).toContainText(IDEA);

  for (const [test_, rating, note] of RATINGS) {
    const group = page.getByRole("radiogroup", { name: `${test_} for ${IDEA}` });
    await group.getByText(rating, { exact: true }).click();
    await expect(group.getByRole("radio", { name: rating })).toBeChecked();
    await page.getByLabel(`Why, for ${test_} for ${IDEA}`).fill(note);
  }
  await page.getByLabel(`What I'm assuming for ${IDEA}`).fill("That parents will pay for a plan rather than free recipes.");
  await page.getByRole("radiogroup", { name: "I'm testing" }).getByText(IDEA).click();
  await page.getByLabel("My hypothesis: person").fill("parents of picky eaters");
  await page.getByLabel("My hypothesis: problem").fill("dinner battles");
  await page.getByLabel("My hypothesis: type of solution").fill("weekly meal plans");
  await page.getByLabel(/^Why this one/).fill("Parents ask me about this every week.");
  await page.getByLabel(/^My biggest unchecked assumption/).fill("They will pay.");
  await page.getByLabel(/^One thing I'll do this week/).fill("Talk to five parents.");
  await page.getByLabel(/^I'll review the evidence on/).fill("2026-12-01");

  await expect(progress(page)).toHaveText("100% complete");
  await expect(status(page)).toHaveText(/^Saved \d/, { timeout: 15_000 });
  const complete = page.getByRole("button", { name: /Complete Lesson/ });
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(page.getByText(/^Lesson \d+ complete$/)).toBeVisible();

  // Second device: a fresh browser context, signed in again, sees every answer.
  const other = await newDevice(browser, path);
  await expect(other.getByRole("textbox", { name: /^Idea A/ })).toHaveValue(IDEA);
  for (const [test_, rating, note] of RATINGS) {
    await expect(other.getByRole("radiogroup", { name: `${test_} for ${IDEA}` }).getByRole("radio", { name: rating })).toBeChecked();
    await expect(other.getByLabel(`Why, for ${test_} for ${IDEA}`)).toHaveValue(note);
  }
  await expect(other.getByLabel("My hypothesis: problem")).toHaveValue("dinner battles");
  await expect(other.getByLabel(/^I'll review the evidence on/)).toHaveValue("2026-12-01");
  await expect(other.getByText(/^Lesson \d+ complete$/)).toBeVisible();
  await expect(progress(other)).toHaveText("100% complete");

  // Still editable after completing.
  await other.getByLabel(/^Why this one/).fill("Parents ask me about this every week. Two paid for a plan last year.");
  await expect(status(other)).toHaveText(/^Saved \d/, { timeout: 15_000 });
});

test("a later worksheet quotes the Lesson 2 hypothesis back to the member", async ({ browser }) => {
  const page = await newDevice(browser, process.env.E2E_WS_CALLBACK_PATH!);
  await expect(page.getByText("I am exploring a business that helps parents of picky eaters solve dinner battles through weekly meal plans.")).toBeVisible();
});

test("downloads the member's worksheet and module PDFs; signed out visitors get none", async ({ browser, playwright, baseURL }) => {
  const path = process.env.E2E_WS_LESSON_PATH!;
  const moduleSlug = path.split("/")[3]!;
  const page = await newDevice(browser, path);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /Download my worksheet/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^BOSS_Module\d+_Lesson\d+_Worksheet\.pdf$/);
  const file = await download.path();
  const { readFileSync } = await import("node:fs");
  expect(readFileSync(file).subarray(0, 5).toString()).toBe("%PDF-");
  if (process.env.E2E_WS_PDF_OUT) await download.saveAs(`${process.env.E2E_WS_PDF_OUT}/downloaded-lesson.pdf`);

  const mod = await page.request.get(`/api/worksheets/module/${moduleSlug}/pdf`);
  expect(mod.status()).toBe(200);
  expect(mod.headers()["content-disposition"]).toMatch(/BOSS_Module\d+_Worksheets\.pdf/);
  expect((await mod.body()).subarray(0, 5).toString()).toBe("%PDF-");

  const anon = await playwright.request.newContext({ baseURL });
  const slug = new URL(await page.getByRole("link", { name: /Download my worksheet/ }).evaluate((a) => (a as HTMLAnchorElement).href)).pathname.split("/")[3]!;
  for (const url of [`/api/worksheets/${slug}/pdf`, `/api/worksheets/module/${moduleSlug}/pdf`]) {
    const r = await anon.get(url, { maxRedirects: 0 });
    expect([401, 307, 308]).toContain(r.status());
    expect(r.headers()["content-type"] ?? "").not.toContain("application/pdf");
  }
  await anon.dispose();
});
