import { describe, expect, it } from "vitest";
import { canTransition } from "./content";

describe("content workflow (D14)", () => {
  it("cannot publish without review and approval", () => {
    expect(canTransition("draft", "published")).toBe(false);
    expect(canTransition("review", "published")).toBe(false);
    expect(canTransition("approved", "published")).toBe(true);
  });
  it("can always return to draft except from draft", () => {
    for (const s of ["review", "approved", "published", "archived"] as const) expect(canTransition(s, "draft")).toBe(true);
    expect(canTransition("draft", "draft")).toBe(false);
  });
  it("archives only published content", () => {
    expect(canTransition("published", "archived")).toBe(true);
    expect(canTransition("draft", "archived")).toBe(false);
  });
});
