import { describe, expect, it } from "vitest";
import l1 from "./fixtures/m1-l1-starting-point.json";
import l2 from "./fixtures/m1-l2-business-direction.json";
import l3 from "./fixtures/m1-l3-customer-research.json";
import l9 from "./fixtures/m1-l9-foundation-blueprint.json";
import { findField, parseWorksheetSchema } from "./schema";

/** Slice E seed content: the schemas the seed script inserts must parse and link up. */
const sheets = { [l1.slug]: parseWorksheetSchema(l1), [l2.slug]: parseWorksheetSchema(l2), [l3.slug]: parseWorksheetSchema(l3), [l9.slug]: parseWorksheetSchema(l9) };

describe("Module 1 seed worksheets", () => {
  it("every completion milestone label is set for Lessons 1 and 2", () => {
    expect(sheets[l1.slug]!.completion.milestone_label).toBe("I answered Lesson 1: Starting Point");
    expect(sheets[l2.slug]!.completion.milestone_label).toBe("I chose a provisional direction and wrote my hypothesis");
  });

  it("Lesson 9 is the full Blueprint: decision cards, Lesson 1 quotes, the cover sentence and the module download", () => {
    const s9 = sheets[l9.slug]!;
    expect(s9.callback_layout).toBeTruthy();
    expect(s9.callbacks!.filter((c) => /^\d+\./.test(c.heading)).map((c) => c.key)).toEqual(["cb_direction", "cb_buyer", "cb_problem", "cb_product", "cb_positioning", "cb_journey"]);
    expect(s9.sections.find((s) => s.key === "started")!.callbacks_inline!.map((c) => c.source_field)).toEqual(["q1_treating_as_business", "q2_pay_for", "q3_blog_disappeared", "realization"]);
    expect(s9.sections.find((s) => s.key === "existing")!.optional).toBe(true);
    expect(s9.pdf).toMatchObject({ cover_sentence_field: "business_sentence", bundle_label: "Download all Module 1 worksheets" });
    expect(s9.completion.milestone_label).toBe("I finished my Business Foundation Blueprint");
  });

  it("every callback points at a field that exists in its source worksheet", () => {
    for (const s of Object.values(sheets))
      for (const section of s.sections)
        if (section.callback) expect(findField(sheets[section.callback.worksheet]!, section.callback.field), `${s.slug} -> ${section.callback.worksheet}.${section.callback.field}`).toBeDefined();
  });

  it("Lesson 1 carries its closing footer note for the PDF", () => {
    expect(sheets[l1.slug]!.footer_note).toBe("You\u2019ll read these answers again in Lesson 9.");
    expect(sheets[l2.slug]!.footer_note).toBeUndefined();
  });

  it("required fields named in completion exist", () => {
    for (const s of Object.values(sheets)) for (const k of s.completion.required_fields) expect(findField(s, k), `${s.slug}.${k}`).toBeDefined();
  });
});
