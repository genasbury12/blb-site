import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Runs without Supabase credentials: proves route protection, page rendering, keyboard use, and
 * accessibility of the public and auth pages. Signed in flows are in signed-in.spec.ts and run only
 * when E2E_SUPABASE=1 with a test project configured.
 */

async function expectNoA11yViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"] }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}

test("home page renders with sign in links and passes axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/signup");
  await expectNoA11yViolations(page);
});

for (const path of ["/app", "/app/audit", "/app/training", "/app/training/business-foundation/sample-lesson-1", "/app/audit/results/00000000-0000-0000-0000-000000000000", "/app/roadmap", "/app/account", "/admin"]) {
  test(`anonymous visitor is sent to sign in from ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(new URL(page.url()).searchParams.get("next")).toBe(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
}

test("member routes are never served to anonymous requests, even without following redirects", async ({ request }) => {
  for (const path of ["/app", "/app/audit", "/app/account"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(307);
    expect(res.headers().location).toContain("/login?next=");
    const body = await res.text();
    expect(body).not.toContain("My Dashboard");
  }
});

test("posts to member routes without a session are redirected before reaching any action", async ({ request }) => {
  const res = await request.post("/app/audit", { headers: { "Next-Action": "forged", "Content-Type": "text/plain" }, data: "[]", maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers().location).toContain("/login?next=");
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("sign in page explains missing configuration, validates input, and is keyboard usable", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Sign in is not set up in this environment")).toBeVisible();
  await page.keyboard.press("Tab"); // skip link
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Email").fill("someone@example.com");
  await page.getByLabel("Password").fill("whatever-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Sign in is not available in this environment yet")).toBeVisible();
  await expectNoA11yViolations(page);
});

test("sign up enforces the password policy before submitting", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("weakpass");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
  await expectNoA11yViolations(page);
});

test("password reset pages render and pass axe", async ({ page }) => {
  for (const path of ["/forgot-password", "/reset-password"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  }
});

test("an invalid email link lands on sign in with a clear message", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=bad&type=signup");
  await expect(page).toHaveURL(/\/login\?error=link/);
  await expect(page.getByText("That link is invalid or has expired.")).toBeVisible();
});

test("design preview renders fixture audit and report, passes axe, and keyboard can answer a question", async ({ page }) => {
  await page.goto("/preview");
  await expect(page.getByText("Design preview with fixture data")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your top three priorities" })).toBeVisible();
  const radios = page.getByRole("radio");
  await radios.first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
});
