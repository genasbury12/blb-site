import { readFileSync } from "node:fs";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

/**
 * 10_DATA_RIGHTS Slice A on staging: "Download all my data". Set up and tear down with
 *   node scripts/staging-worksheet-fixtures.mjs setup   --suite export --env-out /abs/path/export-env.sh
 *   node scripts/staging-worksheet-fixtures.mjs cleanup --suite export --env-out /abs/path/export-env.sh
 * E2E_DX_EMAIL / _PASSWORD          active Blueprint member: one completed and one unfinished Module 1 worksheet
 * E2E_DX_LAPSED_EMAIL / _PASSWORD   member whose access ended two days ago, one completed worksheet
 * E2E_DX_ADMIN_EMAIL / _PASSWORD    the shared staging test admin; E2E_DX_MEMBER_ID the active member's id
 * E2E_DX_LESSON_PATH                Module 1 Lesson 1 page
 */
const enabled = process.env.E2E_SUPABASE === "1" && Boolean(process.env.E2E_DX_EMAIL);
test.skip(!enabled, "Set E2E_SUPABASE=1 and E2E_DX_* to run the data export test.");
test.describe.configure({ mode: "serial" });

async function signedIn(browser: Browser, email: string, password: string, next: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => u.pathname.startsWith("/app") || u.pathname.startsWith("/admin"));
  await page.goto(next, { waitUntil: "networkidle" });
  return page;
}

async function downloadZip(page: Page, button: string | RegExp) {
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.getByRole("button", { name: button }).click()]);
  expect(download.suggestedFilename()).toMatch(/^BOSS_my-data_\d{4}-\d{2}-\d{2}\.zip$/);
  if (process.env.E2E_DX_OUT) await download.saveAs(`${process.env.E2E_DX_OUT}/${Date.now()}-${download.suggestedFilename()}`);
  const files = unzipSync(new Uint8Array(readFileSync((await download.path())!)));
  const json = JSON.parse(strFromU8(files["my-data.json"]!)) as {
    profile: { email: string };
    worksheets: { worksheet: string; status: string; answers: Record<string, unknown> }[];
    about: { files: { path: string }[] };
  };
  return { files, json };
}

test("a member downloads one ZIP with their data, a README and a PDF of each completed worksheet", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await signedIn(browser, process.env.E2E_DX_EMAIL!, process.env.E2E_DX_PASSWORD!, "/app/account");
  await expect(page.getByRole("heading", { name: "Your data" })).toBeVisible();
  const { files, json } = await downloadZip(page, "Download all my data");
  expect(Object.keys(files).sort()).toEqual(["README.txt", "my-data.json", "worksheets/BOSS_Module1_Lesson1_Worksheet.pdf"]);
  expect(strFromU8(files["worksheets/BOSS_Module1_Lesson1_Worksheet.pdf"]!.subarray(0, 5))).toBe("%PDF-");
  expect(json.profile.email).toBe(process.env.E2E_DX_EMAIL);
  expect(json.worksheets.map((w) => `${w.worksheet}:${w.status}`).sort()).toEqual(["m1-l1-starting-point:complete", "m1-l2-business-direction:in_progress"]);
  expect(json.worksheets.find((w) => w.status === "complete")!.answers).toMatchObject({ q1: "My blog posts and Pinterest." });
  await expect(page.getByTestId("data-export-status")).toContainText("Your download has started");

  // One export per 10 minutes.
  await page.getByRole("button", { name: "Download all my data" }).click();
  await expect(page.getByTestId("data-export-status")).toContainText(/You can download again in \d+ minutes?/);
});

test("a member whose access ended can still download everything but cannot open a lesson", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await signedIn(browser, process.env.E2E_DX_LAPSED_EMAIL!, process.env.E2E_DX_LAPSED_PASSWORD!, process.env.E2E_DX_LESSON_PATH!);
  await expect(page.getByText("Training is not part of your current access")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your worksheet" })).toHaveCount(0);

  await page.goto("/app/account", { waitUntil: "networkidle" });
  const { files, json } = await downloadZip(page, "Download all my data");
  // The worksheet sits on a lesson they can no longer open; its PDF still comes with the export.
  expect(Object.keys(files)).toContain("worksheets/BOSS_Module1_Lesson1_Worksheet.pdf");
  expect(json.profile.email).toBe(process.env.E2E_DX_LAPSED_EMAIL);
});

test("an admin exports a member's data from Students & access; signed out and member requests get none", async ({ browser, playwright, baseURL }) => {
  test.setTimeout(120_000);
  const memberId = process.env.E2E_DX_MEMBER_ID!;
  const page = await signedIn(browser, process.env.E2E_DX_ADMIN_EMAIL!, process.env.E2E_DX_ADMIN_PASSWORD!, `/admin/students/${memberId}`);
  await expect(page.getByRole("heading", { name: "Member data" })).toBeVisible();
  const { files, json } = await downloadZip(page, "Export data");
  expect(json.profile.email).toBe(process.env.E2E_DX_EMAIL);
  // The admin copy says who exported it (Slice D).
  expect(strFromU8(files["README.txt"]!)).toMatch(/This is the admin copy, exported by .+ on \w+ \d+, \d{4}\./);
  expect((json as unknown as { about: { exported_by?: string } }).about.exported_by).toBeTruthy();
  expect(Object.keys(files)).toContain("worksheets/BOSS_Module1_Lesson1_Worksheet.pdf");

  const anon = await playwright.request.newContext({ baseURL });
  expect((await anon.post("/api/account/export")).status()).toBe(401);
  expect((await anon.post(`/api/admin/members/${memberId}/export`)).status()).toBe(401);
  await anon.dispose();
  // A member cannot use the admin export for anyone, themselves included.
  const lapsed = await signedIn(browser, process.env.E2E_DX_LAPSED_EMAIL!, process.env.E2E_DX_LAPSED_PASSWORD!, "/app/account");
  expect((await lapsed.request.post(`/api/admin/members/${memberId}/export`)).status()).toBe(404);
});
