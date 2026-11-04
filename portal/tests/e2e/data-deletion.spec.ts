import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * 10_DATA_RIGHTS Slice B on staging: deletion requests. Set up and tear down with
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite deletion --env-out /abs/path/deletion-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite deletion --env-out /abs/path/deletion-env.sh
 * and start the app with the CRON_SECRET from that file.
 * E2E_DEL_EMAIL / _PASSWORD                member with worksheet answers, a path choice and an audit entry naming them
 * E2E_DEL_OVERDUE_EMAIL / _PASSWORD        member whose request is already past 30 days
 * E2E_DEL_STAFF_EMAIL / _PASSWORD          a coach with a pending request (anonymized, never deleted)
 * E2E_DEL_ADMIN_EMAIL / _PASSWORD          the shared staging test admin
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_DEL_EMAIL) && Boolean(process.env.CRON_SECRET);
test.skip(!enabled, "Set E2E_SUPABASE=1, E2E_DEL_* and CRON_SECRET to run the deletion test.");
test.describe.configure({ mode: "serial" });

async function signIn(browser: Browser, email: string, password: string, next: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/app") || u.pathname.startsWith("/admin"));
  await page.goto(next, { waitUntil: "networkidle" });
  return page;
}

async function expectSignInRefused(browser: Browser, email: string, password: string) {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password did not work")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/login");
}

const pendingCard = (page: Page, email: string) => page.getByTestId("deletion-request").filter({ hasText: email });

test("a member reads what deletion means, must type DELETE, sees the pending request and can cancel it", async ({ browser }) => {
  const page = await signIn(browser, process.env.E2E_DEL_EMAIL!, process.env.E2E_DEL_PASSWORD!, "/app/account");
  await page.getByRole("link", { name: "Delete my account and data" }).click();
  await page.waitForURL("**/app/account/delete");
  await expect(page.getByRole("heading", { name: "What we keep, and why" })).toBeVisible();
  await page.getByLabel("Type DELETE to confirm").fill("delete");
  await page.getByRole("button", { name: "Request deletion" }).click();
  await expect(page.getByText("Type DELETE in capital letters to confirm.")).toBeVisible();

  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Request deletion" }).click();
  await page.waitForURL((u) => u.pathname === "/app/account");
  await page.goto("/app/account", { waitUntil: "networkidle" });
  const status = page.getByTestId("deletion-status");
  await expect(status).toContainText(/Requested on \w+ \d+, \d{4}\./);
  await expect(status).toContainText("Your account will be deleted within 30 days. You'll get an email when it's done.");

  await status.getByRole("button", { name: "Cancel my deletion request" }).click();
  await page.waitForURL((u) => u.searchParams.get("deletion") === "cancelled");
  await expect(page.getByTestId("deletion-status")).toContainText("Your deletion request is cancelled. Nothing was deleted.");

  // Ask again for the next test.
  await page.goto("/app/account/delete", { waitUntil: "networkidle" });
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Request deletion" }).click();
  await page.waitForURL((u) => u.pathname === "/app/account");
});

test("an admin deletes it now after typing the member's email; the member can no longer sign in; the log shows only a code", async ({ browser }) => {
  const email = process.env.E2E_DEL_EMAIL!;
  const page = await signIn(browser, process.env.E2E_DEL_ADMIN_EMAIL!, process.env.E2E_DEL_ADMIN_PASSWORD!, "/admin/students/deletions");
  const card = pendingCard(page, email);
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Deleted automatically in 30 days");
  await card.getByLabel("Type the member's email to confirm").fill("someone.else@example.invalid");
  await card.getByRole("button", { name: "Delete now" }).click();
  await expect(card.getByText("That email does not match this member. Nothing was deleted.")).toBeVisible();
  await card.getByLabel("Type the member's email to confirm").fill(email.toUpperCase());
  await card.getByRole("button", { name: "Delete now" }).click();
  await expect(page.getByText("Deleted. The member's account and data are gone.")).toBeVisible({ timeout: 30_000 });

  await expectSignInRefused(browser, email, process.env.E2E_DEL_PASSWORD!);

  await page.goto("/admin/students/deletions?tab=completed", { waitUntil: "networkidle" });
  const code = (await page.locator("td.font-mono").first().textContent())!.trim();
  expect(code).toMatch(/^deleted-user-[0-9a-f]{10}$/);
  await page.goto("/admin/audit-log", { waitUntil: "networkidle" });
  await expect(page.getByText(code).first()).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);
});

test("a staff account is anonymized and blocked instead of deleted", async ({ browser }) => {
  const email = process.env.E2E_DEL_STAFF_EMAIL!;
  const page = await signIn(browser, process.env.E2E_DEL_ADMIN_EMAIL!, process.env.E2E_DEL_ADMIN_PASSWORD!, "/admin/students/deletions");
  const card = pendingCard(page, email);
  await expect(card).toContainText("This account took admin actions and cannot be hard deleted. It will be anonymized and blocked instead.");
  await card.getByLabel("Type the member's email to confirm").fill(email);
  await card.getByRole("button", { name: "Delete now" }).click();
  await expect(page.getByText("This account took admin actions, so it was anonymized and blocked instead of deleted.")).toBeVisible({ timeout: 30_000 });
  await expectSignInRefused(browser, email, process.env.E2E_DEL_STAFF_PASSWORD!);
});

test("the daily job deletes requests past 30 days, and refuses callers without the secret", async ({ playwright, baseURL, browser }) => {
  const api = await playwright.request.newContext({ baseURL });
  expect((await api.get("/api/cron/data-deletion")).status()).toBe(401);
  expect((await api.get("/api/cron/data-deletion", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
  const run = await api.get("/api/cron/data-deletion", { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
  expect(run.status()).toBe(200);
  const body = (await run.json()) as { due: number; deleted: number; failed: number };
  expect(body.failed).toBe(0);
  expect(body.deleted).toBeGreaterThanOrEqual(1);
  await api.dispose();
  await expectSignInRefused(browser, process.env.E2E_DEL_OVERDUE_EMAIL!, process.env.E2E_DEL_OVERDUE_PASSWORD!);
});
