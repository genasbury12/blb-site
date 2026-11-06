import { expect, test } from "@playwright/test";

/**
 * Signed in journeys. These need a Supabase TEST project with migrations applied, the seed loaded,
 * and two confirmed test accounts. They are skipped unless E2E_SUPABASE=1.
 *   E2E_BLUEPRINT_EMAIL / E2E_BLUEPRINT_PASSWORD: account with a Blueprint grant
 *   E2E_NOACCESS_EMAIL / E2E_NOACCESS_PASSWORD: confirmed account with no grants
 */
const enabled = process.env.E2E_SUPABASE === "1";
test.skip(!enabled, "Set E2E_SUPABASE=1 with a Supabase test project to run signed in journeys.");

async function signIn(page: import("@playwright/test").Page, email: string, password: string, next = "/app") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/app"));
}

let firstLesson = "/app/training/business-foundation/sample-lesson-1";

test("Blueprint member: audit draft survives sign out, submits, and a retake keeps lesson completion", async ({ page, browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Writes data; runs once per suite on desktop.");
  test.setTimeout(300_000);
  await signIn(page, process.env.E2E_BLUEPRINT_EMAIL!, process.env.E2E_BLUEPRINT_PASSWORD!);
  await expect(page.getByRole("link", { name: /Start My Business Audit|Resume my audit|Open lesson/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Feedback" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "My Elite Workspace" })).toHaveCount(0);

  await page.goto("/app/training");
  // The first Module 1 lesson, whatever it is called (sample lessons come and go on staging).
  await page.locator('a[href^="/app/training/business-foundation/"]').first().click();
  await page.waitForURL(/\/app\/training\/business-foundation\/[a-z0-9-]+$/);
  firstLesson = new URL(page.url()).pathname;
  const toggle = page.getByRole("button", { name: /Mark lesson complete|Completed/ });
  if ((await toggle.getAttribute("aria-pressed")) !== "true") await toggle.click();
  await expect(page.getByRole("button", { name: /Completed/ })).toBeVisible();

  await page.goto("/app/audit");
  // Repeat runs on staging resume an existing draft: step back to the first question.
  const questionHeading = (n: number | string) => page.getByRole("heading", { name: new RegExp(`^Question ${n} of 30\\.`) });
  await expect(questionHeading("\\d+")).toBeVisible();
  const startAt = Number((await questionHeading("\\d+").textContent())?.match(/Question (\d+)/)?.[1] ?? 1);
  for (let q = startAt; q > 1; q--) {
    await page.getByRole("button", { name: "Back" }).click();
    await expect(questionHeading(q - 1)).toBeVisible();
  }
  const target = page.getByLabel("I have a blog but no clear business.");
  const saveRequest = () => page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/app/audit");
  if (await target.isChecked()) {
    // Already answered on an earlier run: change the answer first so the save below is a real write.
    await Promise.all([saveRequest(), page.getByRole("radio").first().check()]);
  }
  await Promise.all([saveRequest(), target.check()]);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, process.env.E2E_BLUEPRINT_EMAIL!, process.env.E2E_BLUEPRINT_PASSWORD!, "/app/audit");
  // Answering saves the next question as the resume point, so the member returns to question 2.
  await expect(page.getByText(/[1-9]\d? of 30 questions answered/).first()).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("I have a blog but no clear business.")).toBeChecked();
  await expect(questionHeading(1)).toBeVisible();
  for (let q = 1; q <= 30; q++) {
    await expect(questionHeading(q)).toBeVisible();
    await page.getByRole("radio").nth(2).check();
    await page.getByRole("button", { name: /Next|Review answers/ }).click();
  }
  await page.getByRole("button", { name: "Submit my audit" }).click();
  await page.waitForURL(/\/app\/audit\/results\//);
  await expect(page.getByRole("heading", { name: "Your top three priorities" })).toBeVisible();
  const reportPath = new URL(page.url()).pathname;

  // Audit privacy: another member opening the same report URL gets a not found page.
  const other = await (await browser.newContext()).newPage();
  await signIn(other, process.env.E2E_NOACCESS_EMAIL!, process.env.E2E_NOACCESS_PASSWORD!);
  await other.goto(reportPath);
  await expect(other.getByRole("heading", { name: "Your top three priorities" })).toHaveCount(0);
  if (process.env.E2E_ACCELERATOR_EMAIL) {
    const accel = await (await browser.newContext()).newPage();
    await signIn(accel, process.env.E2E_ACCELERATOR_EMAIL, process.env.E2E_ACCELERATOR_PASSWORD!);
    await accel.goto(reportPath);
    await expect(accel.getByRole("heading", { level: 1 })).toHaveText("404");
  }

  await page.goto(firstLesson);
  await expect(page.getByRole("button", { name: /Completed/ })).toBeVisible();
});

test("member without grants sees account but no training", async ({ page }) => {
  await signIn(page, process.env.E2E_NOACCESS_EMAIL!, process.env.E2E_NOACCESS_PASSWORD!);
  await expect(page.getByText("Training is not part of your current access")).toBeVisible();
  await page.goto("/app/training");
  await expect(page.getByText("Training is not part of your current access")).toBeVisible();
  await page.goto("/app/account");
  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
});
