import { describe, expect, it } from "vitest";
import l1 from "./fixtures/m1-l1-starting-point.json";
import l2 from "./fixtures/m1-l2-business-direction.json";
import l3 from "./fixtures/m1-l3-customer-research.json";
import l9 from "./fixtures/m1-l9-foundation-blueprint.json";
import { concreteFields, findField, parseWorksheetSchema, worksheetProgress } from "./schema";

/** Slice E seed content: the schemas the seed script inserts must parse and link up. */
const sheets = { [l1.slug]: parseWorksheetSchema(l1), [l2.slug]: parseWorksheetSchema(l2), [l3.slug]: parseWorksheetSchema(l3), [l9.slug]: parseWorksheetSchema(l9) };

describe("Module 1 seed worksheets", () => {
  it("every completion milestone label is set for Lessons 1 and 2", () => {
    expect(sheets[l1.slug]!.completion.milestone_label).toBe("I answered Lesson 1: Starting Point");
    expect(sheets[l2.slug]!.completion.milestone_label).toBe("I chose a provisional direction and wrote my hypothesis");
  });

  it("the Lesson 9 placeholder quotes Lesson 1 q3 and the Lesson 2 hypothesis, and offers the module download", () => {
    const s9 = sheets[l9.slug]!;
    expect(s9.sections.map((s) => s.callback && `${s.callback.worksheet}.${s.callback.field}`)).toEqual(["m1-l1-starting-point.q3", "m1-l2-business-direction.hypothesis"]);
    expect(s9.module_download).toBe(true);
    expect(concreteFields(s9)).toHaveLength(0);
    expect(worksheetProgress(s9, {}).percent).toBe(100);
  });

  it("every callback points at a field that exists in its source worksheet", () => {
    for (const s of Object.values(sheets))
      for (const section of s.sections)
        if (section.callback) expect(findField(sheets[section.callback.worksheet]!, section.callback.field), `${s.slug} -> ${section.callback.worksheet}.${section.callback.field}`).toBeDefined();
  });

  it("every top of worksheet callback points at a field that exists in its source worksheet", () => {
    for (const s of Object.values(sheets))
      for (const cb of s.callbacks ?? []) expect(findField(sheets[cb.source_worksheet]!, cb.source_field), `${s.slug} -> ${cb.source_worksheet}.${cb.source_field}`).toBeDefined();
    expect(sheets[l3.slug]!.callbacks).toHaveLength(1);
  });

  it("Lesson 1 carries its closing footer note for the PDF", () => {
    expect(sheets[l1.slug]!.footer_note).toBe("You\u2019ll read these answers again in Lesson 9.");
    expect(sheets[l2.slug]!.footer_note).toBeUndefined();
  });

  it("required fields named in completion exist", () => {
    for (const s of Object.values(sheets)) for (const k of s.completion.required_fields) expect(findField(s, k), `${s.slug}.${k}`).toBeDefined();
  });
});
