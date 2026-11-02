// Signs the temporary member in on the deployed site (fresh random password each run, never printed).
import { randomBytes } from "node:crypto";
import { chromium } from "playwright";
import { load, sbAdmin } from "./lib.mjs";
export const site = "https://blb-site-portal.vercel.app";
export async function signedInPage() {
  const s = load();
  const password = randomBytes(18).toString("base64url");
  await sbAdmin("PUT", `/auth/v1/admin/users/${s.userId}`, { password });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${site}/login?next=/app`);
  await page.getByLabel("Email").fill(s.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/app"), { timeout: 30000 });
  return { browser, page };
}
