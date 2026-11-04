import { expect, test, type APIRequestContext, type Browser } from "@playwright/test";

/**
 * 10_DATA_RIGHTS Slice C on staging: the daily job's retention step. Set up and tear down with
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite retention --env-out /abs/path/retention-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite retention --env-out /abs/path/retention-env.sh
 * and start the app with the CRON_SECRET from that file.
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_RET_EXPIRED_EMAIL) && Boolean(process.env.CRON_SECRET);
test.skip(!enabled, "Set E2E_SUPABASE=1, E2E_RET_* and CRON_SECRET to run the retention test.");
test.describe.configure({ mode: "serial" });

type Summary = { remindersSent: number; reminderFailures: number; retentionDeleted: number; requestsDeleted: number; failures: number; status: string };

async function runJob(api: APIRequestContext): Promise<Summary> {
  const res = await api.get("/api/cron/data-rights", { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }, timeout: 120_000 });
  expect(res.status()).toBe(200);
  return (await res.json()) as Summary;
}

async function canSignIn(browser: Browser, email: string, password: string) {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  const outcome = await Promise.race([
    page.waitForURL((u) => u.pathname.startsWith("/app"), { timeout: 15_000 }).then(() => true),
    page.getByText("That email and password did not work").waitFor({ timeout: 15_000 }).then(() => false),
  ]);
  await page.context().close();
  return outcome;
}

test("the job deletes the member 12 months after access ended, reminds at 30 and 7 days, and leaves active members alone", async ({ playwright, baseURL, browser }) => {
  test.setTimeout(180_000);
  const api = await playwright.request.newContext({ baseURL });
  const first = await runJob(api);
  expect(first.failures).toBe(0);
  expect(first.retentionDeleted).toBeGreaterThanOrEqual(1);
  const inactive = Boolean(process.env.E2E_RET_INACTIVE_OLD_EMAIL);
  // Lapsed: one 30 day and one 7 day reminder; no purchase: one 30 day reminder.
  expect(first.remindersSent).toBeGreaterThanOrEqual(inactive ? 3 : 2);
  expect(first.retentionDeleted).toBeGreaterThanOrEqual(inactive ? 2 : 1);

  expect(await canSignIn(browser, process.env.E2E_RET_EXPIRED_EMAIL!, process.env.E2E_RET_EXPIRED_PASSWORD!)).toBe(false);
  expect(await canSignIn(browser, process.env.E2E_RET_THIRTY_EMAIL!, process.env.E2E_RET_THIRTY_PASSWORD!)).toBe(true);
  expect(await canSignIn(browser, process.env.E2E_RET_SEVEN_EMAIL!, process.env.E2E_RET_SEVEN_PASSWORD!)).toBe(true);
  expect(await canSignIn(browser, process.env.E2E_RET_ACTIVE_EMAIL!, process.env.E2E_RET_ACTIVE_PASSWORD!)).toBe(true);
  if (inactive) {
    // No purchase and no sign in for a year and a day: deleted. Last sign in a year less 20 days ago: kept.
    expect(await canSignIn(browser, process.env.E2E_RET_INACTIVE_OLD_EMAIL!, process.env.E2E_RET_INACTIVE_OLD_PASSWORD!)).toBe(false);
    expect(await canSignIn(browser, process.env.E2E_RET_INACTIVE_SOON_EMAIL!, process.env.E2E_RET_INACTIVE_SOON_PASSWORD!)).toBe(true);
  }

  // The next run sends no reminder twice and deletes nothing more.
  const second = await runJob(api);
  expect(second).toMatchObject({ remindersSent: 0, retentionDeleted: 0, failures: 0 });
  await api.dispose();
});

test("Admin, Data settings shows the rules, the counts and the job's runs", async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/login?next=%2Fadmin%2Fsettings%2Fdata");
  await page.getByLabel("Email").fill(process.env.E2E_RET_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_RET_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/admin"));
  await page.goto("/admin/settings/data", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Member data" })).toBeVisible();
  await expect(page.getByText("data and the \"Download all my data\" button stay for 12 months")).toBeVisible();
  await expect(page.getByText("kept 7 years for tax and refunds")).toBeVisible();
  expect(await page.getByTestId("job-run").count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByText("The daily job has not run in the last day")).toHaveCount(0);
  const lapsedCard = page.getByText("Lapsed members kept").locator("..");
  expect(Number((await lapsedCard.textContent())!.match(/\d+/)![0])).toBeGreaterThanOrEqual(2);
});
