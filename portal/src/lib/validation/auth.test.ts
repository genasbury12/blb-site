import { describe, expect, it } from "vitest";
import { newPasswordSchema, resetSchema, signUpSchema } from "./auth";

describe("auth validation", () => {
  it("enforces the password policy", () => {
    expect(newPasswordSchema.safeParse("short1A").success).toBe(false);
    expect(newPasswordSchema.safeParse("alllowercase123").success).toBe(false);
    expect(newPasswordSchema.safeParse("Strongpass12").success).toBe(true);
  });
  it("normalizes email and requires a name", () => {
    const r = signUpSchema.safeParse({ displayName: " Jo ", email: " JO@Example.COM ", password: "Strongpass12" });
    expect(r.success && r.data).toEqual({ displayName: "Jo", email: "jo@example.com", password: "Strongpass12" });
    expect(signUpSchema.safeParse({ displayName: "", email: "jo@example.com", password: "Strongpass12" }).success).toBe(false);
  });
  it("requires matching passwords on reset", () => {
    expect(resetSchema.safeParse({ password: "Strongpass12", confirm: "Strongpass13" }).success).toBe(false);
  });
});
