import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { groupTopCallbacks, resolveCallbacks, type CallbackSource } from "../../src/domain/worksheets/callbacks";
import { exampleAnswers } from "../../src/domain/worksheets/example";
import { concreteFields, parseWorksheetSchema, type Answers, type RatingAnswer, type SentenceAnswer, type WorksheetSchema } from "../../src/domain/worksheets/schema";

/**
 * Brief 18 journey helpers: fill a worksheet in the browser from a set of answers, driven by the schema, and check
 * the quotes a worksheet shows against the same resolver the portal uses.
 */

const FIXTURES = join(__dirname, "../../src/domain/worksheets/fixtures");

export function loadSheet(slug: string): { schema: WorksheetSchema; example: unknown } {
  const raw = JSON.parse(readFileSync(join(FIXTURES, `${slug}.json`), "utf8")) as { example_response?: unknown };
  return { schema: parseWorksheetSchema(raw), example: raw.example_response };
}

export function exampleFor(slug: string, now = new Date()): { schema: WorksheetSchema; answers: Answers } {
  const { schema, example } = loadSheet(slug);
  return { schema, answers: exampleAnswers(schema, example, now) };
}

/** Every action gets a limit, so a control that never appears fails with its name instead of hanging. */
const T = { timeout: 15_000 };

const field = (page: Page, key: string) => page.locator(`[data-field="${key}"]`);

/** Tap the visible chip, as a member does (the radio inside it is visually hidden), and wait for it to take. */
async function pick(page: Page, key: string, value: string) {
  const input = field(page, key).locator(`input[value="${value}"]`);
  const chip = field(page, key).locator("label").filter({ has: page.locator(`input[value="${value}"]`) });
  // Middle of the screen: at the bottom edge the sticky save bar sits over it on a phone.
  await chip.waitFor(T);
  await chip.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await chip.click({ timeout: 10_000 });
  await expect(input).toBeChecked();
}

/** Makes a field's control visible: opens a collapsed optional section, or reveals a hidden variable length row. */
async function reveal(page: Page, schema: WorksheetSchema, key: string) {
  const f = concreteFields(schema).find((c) => c.key === key);
  const section = schema.sections.find((s) => [...s.fields, ...(s.subsections ?? []).flatMap((x) => x.fields)].some((x) => x.key === f?.baseKey));
  if (section?.optional) {
    const toggle = page.getByTestId(`toggle-${section.key}`);
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  }
  if (await field(page, key).count()) return;
  const group = f?.repeat ? schema.repeat_groups?.[f.repeat] : undefined;
  if (group?.add_label) {
    for (let i = 0; i < group.keys.length && !(await field(page, key).count()); i++) await page.getByRole("button", { name: group.add_label }).first().click(T);
  }
  await expect(field(page, key).first()).toBeAttached();
}

/** Types every answer into the form, in schema order. */
export async function fillWorksheet(page: Page, schema: WorksheetSchema, answers: Answers) {
  for (const f of concreteFields(schema)) {
    const v = answers[f.key];
    if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) continue;
    await reveal(page, schema, f.key);
    switch (f.type) {
      case "text":
      case "textarea":
      case "date":
        await field(page, f.key).fill(v as string, T);
        break;
      case "choice":
        await pick(page, f.key, v as string);
        break;
      case "multichoice":
        for (const x of v as string[]) await field(page, f.key).locator(`input[value="${x}"]`).check(T);
        break;
      case "rating": {
        const r = v as RatingAnswer;
        if (r.rating) await pick(page, f.key, r.rating);
        if (r.note) await field(page, `${f.key}.note`).fill(r.note, T);
        break;
      }
      case "sentence":
        for (const slot of f.slots) {
          const sv = (v as SentenceAnswer)[slot.key];
          if (sv) await field(page, `${f.key}.${slot.key}`).fill(sv, T);
        }
        break;
    }
  }
}

/** Every quote the worksheet should show, given the member's earlier worksheets, is on the page. */
export async function expectCallbacks(page: Page, schema: WorksheetSchema, sources: Map<string, CallbackSource>) {
  const { top, sections, inline } = resolveCallbacks(schema, sources);
  const shown: string[] = [];
  for (const g of groupTopCallbacks(top)) {
    const box = page.getByTestId(`callback-${g.key}`);
    if (g.lines.length) for (const line of g.lines) {
      await expect(box).toContainText(line);
      shown.push(line);
    }
    else if (g.missingText) await expect(box).toContainText(g.missingText);
  }
  for (const list of Object.values(inline))
    for (const cb of list) {
      if (!cb.text) continue;
      await expect(page.getByTestId(`inline-${cb.key}`)).toContainText(cb.text);
      shown.push(cb.text);
    }
  for (const [key, cb] of Object.entries(sections)) {
    await expect(page.getByTestId(`callback-${key}`)).toContainText(cb.text);
    shown.push(cb.text);
  }
  return shown;
}

/** Fill, wait for the save, complete, and return the lesson's saved answers as a callback source. */
export async function completeWorksheet(page: Page, lesson: number, schema: WorksheetSchema, answers: Answers): Promise<CallbackSource> {
  await fillWorksheet(page, schema, answers);
  await expect(page.getByTestId("worksheet-progress")).toHaveText("100% complete");
  await page.getByRole("button", { name: `Complete Lesson ${lesson}` }).click();
  await expect(page.getByText(`Lesson ${lesson} complete`, { exact: true })).toBeVisible({ timeout: 20_000 });
  return { title: schema.title, schema, answers, status: "complete" };
}
