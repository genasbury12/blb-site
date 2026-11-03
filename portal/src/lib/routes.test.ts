import { describe, expect, it } from "vitest";
import { isProtectedPath, landingPath, safeNextPath } from "./routes";

describe("isProtectedPath", () => {
  it.each(["/app", "/app/audit", "/admin", "/admin/students"])("%s is protected", (p) => expect(isProtectedPath(p)).toBe(true));
  it.each(["/", "/login", "/apply", "/application", "/pricing"])("%s is public", (p) => expect(isProtectedPath(p)).toBe(false));
});

describe("safeNextPath", () => {
  it("keeps internal portal paths", () => {
    expect(safeNextPath("/app/audit")).toBe("/app/audit");
    expect(safeNextPath("/app/training?x=1")).toBe("/app/training?x=1");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil", "javascript:alert(1)", "/login", "", null, undefined, "/app\r\nSet-Cookie: x"])(
    "rejects %s",
    (n) => expect(safeNextPath(n as string)).toBe("/app"),
  );
});

describe("landingPath", () => {
  it("sends staff to the admin workspace when no destination was asked for", () => {
    expect(landingPath(undefined, true)).toBe("/admin");
    expect(landingPath("/app", true)).toBe("/admin");
    expect(landingPath("https://evil.example", true)).toBe("/admin");
  });
  it("keeps an explicit destination for staff", () => {
    expect(landingPath("/app/plans", true)).toBe("/app/plans");
    expect(landingPath("/admin/elite", true)).toBe("/admin/elite");
  });
  it("sends members to their dashboard or the page they asked for", () => {
    expect(landingPath(undefined, false)).toBe("/app");
    expect(landingPath("/app/audit", false)).toBe("/app/audit");
    expect(landingPath("/admin", false)).toBe("/admin");
  });
});
