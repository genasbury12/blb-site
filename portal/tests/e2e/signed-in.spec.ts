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

test("Blueprint member: audit draft survives sign out, submits, and a retake keeps lesson completion", async ({ page }) => {
  await signIn(page, process.env.E2E_BLUEPRINT_EMAIL!, process.env.E2E_BLUEPRINT_PASSWORD!);
  await expect(page.getByRole("link", { name: /Start My Business Audit|Resume my audit|Open lesson/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Feedback" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "My Elite Workspace" })).toHaveCount(0);

  await page.goto("/app/training");
  await page.getByRole("link", { name: "SAMPLE: Module 1 lesson 1" }).click();
  const toggle = page.getByRole("button", { name: /Mark lesson complete|Completed/ });
  if ((await toggle.getAttribute("aria-pressed")) !== "true") await toggle.click();
  await expect(page.getByRole("button", { name: /Completed/ })).toBeVisible();

  await page.goto("/app/audit");
  await page.getByLabel("I have a blog but no clear business.").check();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, process.env.E2E_BLUEPRINT_EMAIL!, process.env.E2E_BLUEPRINT_PASSWORD!, "/app/audit");
  await expect(page.getByLabel("I have a blog but no clear business.")).toBeChecked();

  for (let i = 0; i < 30; i++) {
    const first = page.getByRole("radio").nth(2);
    await first.check();
    await page.getByRole("button", { name: /Next|Review answers/ }).click();
  }
  await page.getByRole("button", { name: "Submit my audit" }).click();
  await page.waitForURL(/\/app\/audit\/results\//);
  await expect(page.getByRole("heading", { name: "Your top three priorities" })).toBeVisible();

  await page.goto("/app/training/business-foundation/sample-lesson-1");
  await expect(page.getByRole("button", { name: /Completed/ })).toBeVisible();
});

test("member without grants sees account but no training", async ({ page }) => {
  await signIn(page, process.env.E2E_NOACCESS_EMAIL!, process.env.E2E_NOACCESS_PASSWORD!);
  await expect(page.getByText("Training is not part of your current access")).toBeVisible();
  await page.goto("/app/training");
  await expect(page.getByText("Training is not part of your current access")).toBeVisible();
  await page.goto("/app/account");
  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();
});
