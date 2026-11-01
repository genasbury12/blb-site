import { test } from "@playwright/test";

/** Milestone screenshots for docs/BUILD_STATUS.md. Run with SCREENSHOTS=1. */
test.skip(process.env.SCREENSHOTS !== "1", "Set SCREENSHOTS=1 to capture milestone screenshots.");

for (const [name, path] of [["home", "/"], ["login", "/login"], ["signup", "/signup"], ["preview", "/preview"]] as const) {
  test(`screenshot ${name}`, async ({ page }, info) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `../docs/screenshots/m2-${name}-${info.project.name}.png`, fullPage: true });
  });
}
