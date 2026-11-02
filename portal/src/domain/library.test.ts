import { describe, expect, it } from "vitest";
import { sanitizeSearch } from "./library";

describe("library search input", () => {
  it("strips filter syntax and wildcards", () => {
    expect(sanitizeSearch("pinterest%,status.eq.draft)")).toBe("pinterest status eq draft");
    expect(sanitizeSearch(" a ")).toBeNull();
    expect(sanitizeSearch("x".repeat(200))?.length).toBe(80);
  });
});
