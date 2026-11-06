import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveCallbacks, sourceKey, type CallbackSource } from "./callbacks";
import { exampleAnswers, exampleCaption, sectionExample } from "./example";
import { findField, parseWorksheetSchema, worksheetProgress, type WorksheetSchema } from "./schema";

/**
 * Brief 18: the Module 1 worksheets as one set. Every schema parses, every callback names a field that exists in
 * its source (through the Lesson 1 key mapping), the key contract holds, and each worked example is a complete,
 * valid set of answers.
 */
const dir = join(__dirname, "fixtures");
const raw = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.startsWith("m1-") && f.endsWith(".json"))
    .map((f) => {
      const json = JSON.parse(readFileSync(join(dir, f), "utf8")) as Record<string, unknown> & { slug: string };
      return [json.slug, json];
    }),
);
const sheets: Record<string, WorksheetSchema> = Object.fromEntries(Object.entries(raw).map(([slug, json]) => [slug, parseWorksheetSchema(json)]));

/** Brief 18, "The key contract". */
const CONTRACT: Record<string, string[]> = {
  "m1-l1-starting-point": ["q1_treating_as_business", "q2_pay_for", "q3_blog_disappeared", "realization"],
  "m1-l2-business-direction": ["hypothesis", "chosen"],
  "m1-l3-customer-research": ["theme_1", "theme_2", "theme_3", "snapshot", "snap_language", "snap_objections", "snap_constraints"],
  "m1-l4-problem-validation": ["priority_problem", "priority_evidence", "validation_activity", "rule_continue", "rule_revise", "review_date"],
  "m1-l5-product-direction": ["product_concept", "format", "smallest_version", "outcome_promise", "product_decision"],
  "m1-l6-positioning": ["positioning", "differentiator", "not_for"],
  "m1-l7-messaging": ["headline", "supporting_statement", "benefit_1", "benefit_2", "benefit_3", "objection_1", "objection_2", "proof_available", "claims_to_remove"],
  "m1-l8-blog-to-buyer": ["first_topic", "reader_question", "reader_stage", "cta", "email_destination", "offer_destination", "next_improvement"],
};

describe("Module 1 worksheets as a set (brief 18)", () => {
  it("has the worksheets for Lessons 1 to 9", () => {
    expect(Object.keys(sheets).sort()).toEqual(expect.arrayContaining(Object.keys(CONTRACT)));
  });

  it.each(Object.entries(CONTRACT))("%s keeps the keys later lessons quote", (slug, keys) => {
    const s = sheets[slug];
    if (!s) return; // not delivered yet
    for (const k of keys) expect(findField(s, sourceKey(slug, k)), `${slug}.${k}`).toBeDefined();
  });

  it("maps the Lesson 1 keys onto the seeded ones without renaming them", () => {
    expect(sourceKey("m1-l1-starting-point", "q1_treating_as_business")).toBe("q1");
    expect(sourceKey("m1-l1-starting-point", "q3_blog_disappeared")).toBe("q3");
    expect(sourceKey("m1-l1-starting-point", "realization")).toBe("realization");
    expect(sourceKey("m1-l2-business-direction", "hypothesis")).toBe("hypothesis");
  });

  it.each(Object.keys(sheets))("%s: every callback points at a real field of its source", (slug) => {
    const s = sheets[slug]!;
    for (const cb of s.callbacks ?? []) {
      const src = sheets[cb.source_worksheet];
      expect(src, `${slug} -> ${cb.source_worksheet}`).toBeDefined();
      expect(findField(src!, sourceKey(cb.source_worksheet, cb.source_field)), `${slug} -> ${cb.source_worksheet}.${cb.source_field}`).toBeDefined();
    }
    for (const f of s.sections.flatMap((x) => x.fields))
      if (f.prefill_from) expect(findField(sheets[f.prefill_from.worksheet]!, f.prefill_from.field.replace("{k}", "1"))).toBeDefined();
  });

  it.each(Object.keys(sheets))("%s: required fields and callbacks_provided keys exist", (slug) => {
    const s = sheets[slug]!;
    for (const k of s.completion.required_fields) expect(findField(s, k), `${slug}.${k}`).toBeDefined();
    for (const k of Object.keys(s.callbacks_provided ?? {})) expect(findField(s, k), `${slug} provides ${k}`).toBeDefined();
  });

  it.each(Object.keys(sheets).filter((slug) => raw[slug]!.example_response))("%s: the worked example is valid and complete", (slug) => {
    const s = sheets[slug]!;
    const answers = exampleAnswers(s, raw[slug]!.example_response, new Date("2026-11-05T12:00:00Z"));
    expect(worksheetProgress(s, answers).missing).toEqual([]);
  });

  it("with every worked example complete, every callback in the set resolves to a quote", () => {
    const sources = new Map<string, CallbackSource>();
    for (const [slug, s] of Object.entries(sheets)) {
      const ex = raw[slug]!.example_response;
      if (ex) sources.set(slug, { title: s.title, schema: s, answers: exampleAnswers(s, ex, new Date("2026-11-05T12:00:00Z")), status: "complete" });
    }
    for (const [slug, s] of Object.entries(sheets)) {
      for (const cb of resolveCallbacks(s, sources).top) {
        if (!sources.has(s.callbacks!.find((c) => c.key === cb.key)!.source_worksheet)) continue;
        expect(cb.text, `${slug}: ${cb.key}`).toBeTruthy();
      }
    }
  });
});

describe("worked examples shown to members (owner decision 2026-11-06)", () => {
  it("every lesson with an example has lines in at least one section, and never shows a key or [object Object]", () => {
    for (const [slug, s] of Object.entries(sheets)) {
      if (!raw[slug]!.example_response) continue;
      const lines = s.sections.flatMap((sec) => sectionExample(s, sec));
      expect(lines.length, slug).toBeGreaterThan(0);
      for (const l of lines) expect(l.text, `${slug}.${l.key}`).not.toMatch(/\[object|undefined/);
      expect(exampleCaption(s), slug).toMatch(/Hypothetical example/);
    }
  });

  it("reads rows, ratings, chosen problems and relative dates as a member would", () => {
    const l3 = sheets["m1-l3-customer-research"]!;
    const ev = sectionExample(l3, l3.sections[0]!);
    expect(ev[0]).toMatchObject({ label: "Observation 1: What she said or did" });
    expect(ev.find((l) => l.key === "ev_conf_1")!.text).toBe("Observed");
    expect(sectionExample(l3, l3.sections[1]!).find((l) => l.key === "theme_rows_1")!.text).toBe("Observations 1, 2");
    const l4 = sheets["m1-l4-problem-validation"]!;
    const lines4 = l4.sections.flatMap((sec) => sectionExample(l4, sec));
    expect(lines4.find((l) => l.key === "spec_1")!.text).toMatch(/^Strong: /);
    expect(lines4.find((l) => l.key === "priority_choice")!.text).toMatch(/^1: Deciding what to cook/);
    expect(lines4.find((l) => l.key === "review_date")!.text).toBe("7 days from today");
    const l6 = sheets["m1-l6-positioning"]!;
    expect(l6.sections.flatMap((sec) => sectionExample(l6, sec)).find((l) => l.key === "diff_rating")!.text).toMatch(/^Uncertain: /);
  });
});
