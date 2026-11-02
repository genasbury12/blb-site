import { test } from "@playwright/test";

/** Milestone screenshots for docs/BUILD_STATUS.md. Run with SCREENSHOTS=1. */
test.skip(process.env.SCREENSHOTS !== "1", "Set SCREENSHOTS=1 to capture milestone screenshots.");

for (const [name, path] of [["home", "/"], ["login", "/login"], ["preview", "/preview"], ["refund-policy", "/refund-policy"]] as const) {
  test(`screenshot ${name}`, async ({ page }, info) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `../docs/screenshots/m7-${name}-${info.project.name}.png`, fullPage: true });
  });
}
