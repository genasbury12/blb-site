import { describe, expect, it } from "vitest";
import { COLORS as C, contrastRatio } from "./tokens";

/** WCAG 2.2: 4.5:1 body text, 3:1 large text and UI components (borders, focus rings). */
describe("palette contrast (verified, not assumed)", () => {
  it.each([
    ["ink on ivory", C.ink, C.ivory],
    ["ink on white", C.ink, C.white],
    ["ink on rose", C.ink, C.rose],
    ["muted ink on ivory", C.inkMuted, C.ivory],
    ["muted ink on white", C.inkMuted, C.white],
    ["white on plum (buttons)", C.white, C.plum],
    ["white on deep plum (button hover)", C.white, C.plumDeep],
    ["plum on ivory (links)", C.plum, C.ivory],
    ["plum on rose", C.plum, C.rose],
    ["danger on ivory", C.danger, C.ivory],
    ["danger on white", C.danger, C.white],
    ["success on ivory", C.success, C.ivory],
  ])("%s meets 4.5:1 for body text", (_, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["mauve border on ivory", C.mauve, C.ivory],
    ["mauve border on white", C.mauve, C.white],
    ["plum focus ring on rose", C.plum, C.rose],
  ])("%s meets 3:1 for UI components", (_, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it("documents why mauve is not used for body text", () => {
    expect(contrastRatio(C.mauve, C.ivory)).toBeLessThan(4.5);
    expect(contrastRatio(C.mauve, C.white)).toBeLessThan(4.5);
  });
});
