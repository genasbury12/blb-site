import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Elite from a sales call, paid by hand, on staging: the admin accepts the client by name and email (no application,
 * nothing emailed), her plans page then offers Elite checkout instead of "Apply for Elite", and once the admin grants
 * the Elite program by hand her private workspace opens. One run per fixture setup (she can only be accepted once):
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite elitecall --env-out /abs/path/elitecall-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite elitecall --env-out /abs/path/elitecall-env.sh
 * E2E_CALL_ADMIN_EMAIL / _PASSWORD    the shared staging test admin
 * E2E_CALL_CLIENT_ID / _EMAIL / _PASSWORD   a temporary account with no purchase
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_CALL_ADMIN_EMAIL);
test.skip(!enabled, "Set E2E_SUPABASE=1 and E2E_CALL_* to run the sales call test.");
test.describe.configure({ mode: "serial" });

const env = (k: string) => process.env[k]!;
const shot = async (page: Page, name: string) => {
  if (process.env.E2E_SHOTS) await page.locator("main").screenshot({ path: `${process.env.E2E_SHOTS}/${name}.png` });
};

async function signIn(browser: Browser, email: string, password: string, next: string) {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith(next));
  return page;
}

let admin: Page;
let client: Page;
test.beforeAll(async ({ browser }) => {
  admin = await signIn(browser, env("E2E_CALL_ADMIN_EMAIL"), env("E2E_CALL_ADMIN_PASSWORD"), "/admin/elite");
  client = await signIn(browser, env("E2E_CALL_CLIENT_EMAIL"), env("E2E_CALL_CLIENT_PASSWORD"), "/app");
});

test("before the call she would have to apply", async () => {
  await client.goto("/app/plans");
  await expect(client.getByRole("link", { name: "Apply for Elite" })).toBeVisible();
});

test("the admin accepts her from the sales call, emailing nothing", async () => {
  await admin.goto("/admin/elite");
  const form = admin.locator("form", { has: admin.locator("#call-email") }).filter({ visible: true });
  await form.getByLabel("Her name").fill("STAGING TEST Sales Call Client");
  await form.getByLabel("Her email").fill(env("E2E_CALL_CLIENT_EMAIL").toUpperCase());
  await form.getByLabel("Note from the call (optional)").fill("Call on Nov 9. Paying by hand.");
  await expect(form.getByRole("checkbox")).not.toBeChecked();
  await form.getByRole("button", { name: "Accept for Elite" }).click();
  const status = form.getByTestId("form-status");
  await expect(status).toContainText("is accepted for Elite until", { timeout: 15000 });
  await expect(status).toContainText("Nothing was emailed");
  await shot(admin, "sales-call-accepted");

  // A second accept for the same email is refused with a plain reason.
  await form.getByLabel("Her name").fill("STAGING TEST Sales Call Client");
  await form.getByLabel("Her email").fill(env("E2E_CALL_CLIENT_EMAIL"));
  await form.getByRole("button", { name: "Accept for Elite" }).click();
  await expect(status).toContainText("already accepted", { timeout: 15000 });
});

test("her plans page now offers Elite checkout instead of the application", async () => {
  await client.goto("/app/plans");
  await expect(client.getByRole("link", { name: "Apply for Elite" })).toHaveCount(0);
  if (process.env.FEATURE_BILLING === "true") {
    await expect(client.getByRole("button", { name: "Pay $4,997 in full" })).toBeVisible();
    await expect(client.getByRole("button", { name: "Six payments of $897" })).toBeVisible();
  }
});

test("granting the Elite program by hand opens her workspace with 12 hours", async () => {
  await client.goto("/app/elite");
  await expect(client.getByText("Your private workspace")).toHaveCount(0);

  await admin.goto(`/admin/students/${env("E2E_CALL_CLIENT_ID")}`);
  const form = admin.locator("form", { has: admin.locator("#gp-s") }).filter({ visible: true });
  await form.getByLabel("Program").selectOption("elite");
  await form.getByLabel("Reason").fill("STAGING TEST paid by hand after the sales call");
  await form.getByRole("button", { name: "Grant program" }).click();
  await expect(form.getByTestId("form-status")).toContainText("Her Elite workspace and 12 included hours are ready.", { timeout: 15000 });
  await shot(admin, "sales-call-granted");

  await client.goto("/app/elite");
  await expect(client.getByRole("heading", { name: "Your private workspace" })).toBeVisible();
  await expect(client.getByText("Included hours")).toBeVisible();
  await expect(client.getByRole("progressbar", { name: "Included hours used" })).toHaveAttribute("aria-valuemax", "720");
  await shot(client, "sales-call-workspace");
});
