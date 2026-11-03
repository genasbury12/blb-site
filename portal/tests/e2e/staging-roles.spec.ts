import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Signed in journeys for all six staging roles. Skipped unless E2E_SUPABASE=1.
 * Accounts come from scripts/provision-test-accounts.mjs (--with-sample-content) and the labeled fixtures from
 * scripts/staging-permission-check.mjs. Credentials are read from E2E_<ROLE>_EMAIL / E2E_<ROLE>_PASSWORD
 * for ADMIN, COACH, BLUEPRINT, ACCELERATOR, ELITE and NOACCESS. Read only, except where a test says so.
 */
const enabled = process.env.E2E_SUPABASE === "1";
test.skip(!enabled, "Set E2E_SUPABASE=1 with a Supabase staging project to run signed in journeys.");

type Role = "admin" | "coach" | "blueprint" | "accelerator" | "elite" | "noaccess";

async function signIn(page: Page, role: Role, next = "/app") {
  const R = role.toUpperCase();
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(process.env[`E2E_${R}_EMAIL`]!);
  await page.getByLabel("Password").fill(process.env[`E2E_${R}_PASSWORD`]!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/app") || u.pathname.startsWith("/admin"));
}

async function newSignedInPage(browser: Browser, role: Role, next = "/app") {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, role, next);
  return page;
}

/** On phone widths the menu sits behind a "Menu" disclosure; open it so links are visible. */
async function openMenu(page: Page) {
  const summary = page.locator("summary", { hasText: "Menu" });
  if (await summary.isVisible()) {
    await summary.click();
    await expect(page.getByRole("navigation", { name: "Member" })).toBeVisible();
  }
}

const NOT_INCLUDED = /is not part of your current access/;
const MEMBER_NAV = ["My Training", "Implementation Library", "My Business Audit", "My Roadmap", "Coaching", "Workshops", "Community", "Feedback", "My Elite Workspace"];
const EXPECTED_NAV: Record<Role, string[]> = {
  admin: [],
  coach: [],
  noaccess: [],
  blueprint: ["My Training", "Implementation Library", "My Business Audit", "My Roadmap"],
  accelerator: ["My Training", "Implementation Library", "My Business Audit", "My Roadmap", "Coaching", "Workshops", "Community", "Feedback"],
  elite: MEMBER_NAV,
};
const PAGE_FOR: Record<string, string> = {
  "My Training": "/app/training",
  "Implementation Library": "/app/library",
  "My Business Audit": "/app/audit",
  "My Roadmap": "/app/roadmap",
  Coaching: "/app/coaching",
  Workshops: "/app/workshops",
  Community: "/app/community",
  Feedback: "/app/feedback",
  "My Elite Workspace": "/app/elite",
};

async function expectNotFound(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("404");
}

for (const role of Object.keys(EXPECTED_NAV) as Role[]) {
  test(`${role}: menu and member pages match purchased access`, async ({ page }) => {
    await signIn(page, role);
    if (role === "admin" || role === "coach") await page.goto("/app");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Test");
    await openMenu(page);
    const nav = page.getByRole("navigation", { name: "Member" });
    await expect(nav.getByRole("link", { name: "My Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Billing" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "My Account" })).toBeVisible();
    for (const label of MEMBER_NAV) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(EXPECTED_NAV[role].includes(label) ? 1 : 0);
    }
    for (const label of MEMBER_NAV) {
      await page.goto(PAGE_FOR[label]!);
      const blocked = page.getByText(NOT_INCLUDED);
      if (EXPECTED_NAV[role].includes(label)) await expect(blocked).toHaveCount(0);
      else await expect(blocked).toBeVisible();
    }
    await openMenu(page);
    const staffLink = page.getByRole("link", { name: "Open admin workspace" });
    await expect(staffLink).toHaveCount(role === "admin" || role === "coach" ? 1 : 0);
  });
}

// I-43 (owner decision 2026-11-03): staff land in the admin workspace unless a destination was asked for.
for (const role of Object.keys(EXPECTED_NAV) as Role[]) {
  test(`${role}: lands on the right home after sign in`, async ({ page }) => {
    const staff = role === "admin" || role === "coach";
    await signIn(page, role);
    await expect(page).toHaveURL(new RegExp(staff ? "/admin$" : "/app$"));
    if (staff) {
      await page.getByRole("button", { name: "Sign out" }).click().catch(() => undefined);
      await page.context().clearCookies();
      await signIn(page, role, "/app/account");
      await expect(page).toHaveURL(/\/app\/account$/);
    }
  });
}

for (const role of ["blueprint", "accelerator", "elite", "noaccess"] as Role[]) {
  test(`${role}: admin workspace is hidden`, async ({ page }) => {
    await signIn(page, role);
    for (const path of ["/admin", "/admin/students", "/admin/elite", "/admin/billing", "/admin/audit-log"]) await expectNotFound(page, path);
  });
}

const PURCHASES: Record<string, { name: string; price: string } | null> = {
  blueprint: { name: "BOSS Blueprint", price: "$497" },
  accelerator: { name: "BOSS Accelerator", price: "$1,497" },
  elite: { name: "BOSS Elite", price: "$4,997" },
  noaccess: null,
};
for (const [role, purchase] of Object.entries(PURCHASES) as [Role, (typeof PURCHASES)[string]][]) {
  test(`${role}: billing and account show the right purchase and access dates`, async ({ page }) => {
    await signIn(page, role, "/app/billing");
    await page.goto("/app/billing");
    await expect(page.getByRole("heading", { name: "Payments and memberships" })).toBeVisible();
    if (purchase) {
      await expect(page.getByText(purchase.name)).toBeVisible();
      await expect(page.getByText(purchase.price)).toBeVisible();
      await expect(page.getByText("Paid in full").first()).toBeVisible();
    } else {
      await expect(page.getByText("No program purchases on this account yet.")).toBeVisible();
    }
    await page.goto("/app/account");
    await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
    if (purchase) {
      const year = new Date().getFullYear() + 1;
      await expect(page.getByText("Training modules")).toBeVisible();
      await expect(page.getByText(new RegExp(`\\b${year}\\b`)).first()).toBeVisible();
    } else {
      await expect(page.getByText("There is no program access on this account yet.")).toBeVisible();
    }
  });
}

test("accelerator: coaching hub, replay, workshops and feedback allowance", async ({ page }) => {
  await signIn(page, "accelerator", "/app/coaching");
  await page.goto("/app/coaching");
  await expect(page.getByText("STAGING TEST: Weekly group coaching")).toBeVisible();
  await expect(page.getByText("STAGING TEST: Past group coaching with replay")).toBeVisible();
  await page.goto("/app/workshops");
  await expect(page.getByText("SAMPLE: Staging test workshop")).toBeVisible();
  await page.goto("/app/feedback");
  await expect(page.getByText(/of 2/).first()).toBeVisible();
});

test("blueprint: coaching links and replays are not reachable", async ({ page }) => {
  await signIn(page, "blueprint");
  for (const path of ["/app/coaching", "/app/workshops", "/app/workshops/staging-test-workshop", "/app/feedback", "/app/community"]) {
    await page.goto(path);
    await expect(page.getByText("STAGING TEST")).toHaveCount(0);
    await expect(page.getByText("example.invalid")).toHaveCount(0);
  }
});

test("Elite privacy: client sees their board section but never coach notes; other roles cannot open the board", async ({ browser }) => {
  const elite = await newSignedInPage(browser, "elite", "/app/elite");
  await elite.goto("/app/elite");
  await expect(elite.getByRole("heading", { name: "Your private workspace" })).toBeVisible();
  // I-54: roadmap, tasks and files live on the client's Claude board; the workspace shows the board link or a setup note.
  await expect(elite.getByText(/Open your board in Claude|Your coach is setting up your board/)).toBeVisible();
  await expect(elite.getByText("STAGING TEST: Month 1 roadmap focus")).toHaveCount(0);
  await expect(elite.getByText("STAGING TEST: Private coach note")).toHaveCount(0);
  await expect(elite.getByText("Coach only. Clients must never see this.")).toHaveCount(0);

  const coach = await newSignedInPage(browser, "coach", "/admin/elite");
  await coach.goto("/admin/elite");
  await expect(coach.getByText("1 of 5")).toBeVisible();
  const boardLink = coach.locator('a[href^="/admin/elite/"]').first();
  const boardPath = await boardLink.getAttribute("href");
  expect(boardPath).toMatch(/^\/admin\/elite\/[0-9a-f-]{36}$/);
  await coach.goto(boardPath!);
  await expect(coach.getByText("STAGING TEST: Private coach note")).toBeVisible();

  await expectNotFound(elite, boardPath!);
  for (const role of ["accelerator", "blueprint", "noaccess"] as Role[]) {
    const other = await newSignedInPage(browser, role);
    await expectNotFound(other, boardPath!);
    await other.goto("/app/elite");
    await expect(other.getByText(NOT_INCLUDED)).toBeVisible();
    await expect(other.getByText("STAGING TEST")).toHaveCount(0);
    await other.context().close();
  }
});

test("coach: sees only assigned members and no admin only pages", async ({ page }) => {
  await signIn(page, "coach", "/admin");
  await page.goto("/admin/students");
  await expect(page.getByRole("heading", { name: "Your members" })).toBeVisible();
  await expect(page.getByText("Test Elite")).toBeVisible();
  for (const name of ["Test Blueprint", "Test Accelerator", "Test No Access"]) await expect(page.getByText(name)).toHaveCount(0);
  await expectNotFound(page, "/admin/billing");
  await expectNotFound(page, "/admin/audit-log");
});

test("admin: sees every account, billing in test mode, audit log and Elite capacity", async ({ page }) => {
  await signIn(page, "admin", "/admin");
  await page.goto("/admin/students");
  await expect(page.getByRole("heading", { name: "Students and access" })).toBeVisible();
  for (const name of ["Test Admin", "Test Coach", "Test Blueprint", "Test Accelerator", "Test Elite", "Test No Access"]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
  await page.goto("/admin/billing");
  await expect(page.getByText("Stripe test mode")).toBeVisible();
  await page.goto("/admin/audit-log");
  await expect(page.getByRole("heading", { name: "Who changed what" })).toBeVisible();
  await page.goto("/admin/elite");
  await expect(page.getByText("1 of 5")).toBeVisible();
});
