import { describe, expect, it } from "vitest";
import { visibleNav, type FeatureKey } from "./features";

const labels = (f: FeatureKey[], flags = {}) => visibleNav(new Set(f), flags).map((n) => n.label);

describe("member navigation", () => {
  it("shows only dashboard and account without grants (expired access keeps account)", () => {
    expect(labels([])).toEqual(["My Dashboard", "Billing", "My Account"]);
  });
  it("Blueprint never sees coaching, feedback or Elite", () => {
    const blueprint: FeatureKey[] = ["curriculum.read", "audit.use", "library.read", "roadmap.use"];
    expect(labels(blueprint, { coaching: true, community: true, feedback: true, elite: true })).toEqual([
      "My Dashboard", "My Training", "Implementation Library", "My Business Audit", "My Roadmap", "Billing", "My Account",
    ]);
  });
  it("hides unbuilt sections even when entitled", () => {
    const accelerator: FeatureKey[] = ["curriculum.read", "audit.use", "roadmap.use", "group_coaching.access", "feedback.submit"];
    expect(labels(accelerator)).not.toContain("Feedback");
    expect(labels(accelerator, { feedback: true })).toContain("Feedback");
  });
});

describe("I-11: DFY extension", () => {
  it("shows the Elite workspace to a client who only holds DFY hours during the 30 day extension", () => {
    expect(labels(["elite_dfu_hours.use"], { elite: true })).toContain("My Elite Workspace");
  });
});
