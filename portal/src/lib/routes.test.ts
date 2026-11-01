import { describe, expect, it } from "vitest";
import { isProtectedPath, safeNextPath } from "./routes";

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
