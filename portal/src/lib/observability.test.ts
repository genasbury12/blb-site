import { describe, expect, it } from "vitest";
import { scrub, scrubString } from "./observability";

describe("PII scrubbing", () => {
  it("redacts emails, JWTs, Stripe secrets, and card-like numbers", () => {
    const s = scrubString(
      "user jane@example.com token eyJhbGciOiJIUzI1.eyJzdWIiOiIxMjM0NTY3.abcdefghijklmnop key sk_test_ABCDEFGH1234 card 4242 4242 4242 4242",
    );
    expect(s).not.toContain("jane@example.com");
    expect(s).not.toContain("eyJhbGciOiJIUzI1");
    expect(s).not.toContain("sk_test_ABCDEFGH1234");
    expect(s).not.toContain("4242 4242 4242 4242");
  });
  it("redacts sensitive keys recursively", () => {
    const out = scrub({ user: { email: "a@b.co", answers: { Q1: "A" }, id: "u1" }, list: ["x@y.com"] });
    expect(out).toEqual({ user: { email: "[redacted]", answers: "[redacted]", id: "u1" }, list: ["[redacted-email]"] });
  });
});
