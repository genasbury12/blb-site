import { describe, expect, it } from "vitest";
import { assertStripeKeyAllowed, isEmailRecipientAllowed, isFeatureEnabled, STRIPE_LIVE_APPROVAL_TOKEN } from "./env";

describe("assertStripeKeyAllowed", () => {
  it("accepts test keys", () => {
    expect(assertStripeKeyAllowed("sk_test_abc", undefined)).toBe("sk_test_abc");
  });
  it("refuses live keys without owner approval", () => {
    expect(() => assertStripeKeyAllowed("sk_live_abc", undefined)).toThrow(/owner approval/);
    expect(() => assertStripeKeyAllowed("sk_live_abc", "yes")).toThrow(/owner approval/);
  });
  it("accepts live keys only with the exact approval token", () => {
    expect(assertStripeKeyAllowed("sk_live_abc", STRIPE_LIVE_APPROVAL_TOKEN)).toBe("sk_live_abc");
  });
  it("refuses missing or unknown keys", () => {
    expect(() => assertStripeKeyAllowed(undefined, undefined)).toThrow();
    expect(() => assertStripeKeyAllowed("pk_test_abc", undefined)).toThrow();
  });
});

describe("isEmailRecipientAllowed", () => {
  it("never sends when sending is disabled", () => {
    expect(isEmailRecipientAllowed("a@x.com", { appEnv: "production", sendingEnabled: false, allowlist: "" })).toBe(false);
  });
  it("only sends to allowlisted addresses outside production", () => {
    const env = { appEnv: "staging" as const, sendingEnabled: true, allowlist: "qa@x.com, Owner@X.com" };
    expect(isEmailRecipientAllowed("qa@x.com", env)).toBe(true);
    expect(isEmailRecipientAllowed("owner@x.com", env)).toBe(true);
    expect(isEmailRecipientAllowed("customer@y.com", env)).toBe(false);
  });
});

describe("isFeatureEnabled", () => {
  it("is off unless exactly 'true'", () => {
    expect(isFeatureEnabled("billing", { FEATURE_BILLING: "true" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(isFeatureEnabled("billing", { FEATURE_BILLING: "1" } as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(isFeatureEnabled("billing", {} as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});
