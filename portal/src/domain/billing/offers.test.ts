import { describe, expect, it } from "vitest";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- inspecting the Stripe params object shape
type StripeLike = Record<string, any>;
import { buildCheckoutParams, eligibility, findOffer, offerTotalCents, OFFERS, type PurchaseHistory } from "./offers";

const none: PurchaseHistory = { programs: [], activeSubscriptions: [], coachingEndsAt: null, boardEndsAt: null, eliteAccepted: false };
const now = new Date("2027-04-01T00:00:00Z");

describe("approved offers (D04)", () => {
  it("match the approved prices and installment totals", () => {
    const totals = Object.fromEntries(OFFERS.map((o) => [`${o.sku}:${o.plan}`, offerTotalCents(o)]));
    expect(totals).toEqual({
      "blueprint:pay_in_full": 49700, "blueprint:six_installments": 58200,
      "accelerator:pay_in_full": 149700, "accelerator:six_installments": 178200,
      "elite:pay_in_full": 499700, "elite:six_installments": 538200,
      "graduate_coaching:monthly": 9700, "elite_board:monthly": 9700,
    });
  });
});

describe("eligibility (I-32)", () => {
  it("Elite requires an accepted application", () => {
    const elite = findOffer("elite", "pay_in_full")!;
    expect(eligibility(elite, none, now).allowed).toBe(false);
    expect(eligibility(elite, { ...none, eliteAccepted: true }, now).allowed).toBe(true);
  });
  it("graduate requires Accelerator or Elite and starts billing when coaching ends", () => {
    const grad = findOffer("graduate_coaching", "monthly")!;
    expect(eligibility(grad, { ...none, programs: [{ sku: "blueprint", status: "paid" }] }, now).allowed).toBe(false);
    const end = new Date("2027-06-01T00:00:00Z");
    expect(eligibility(grad, { ...none, programs: [{ sku: "accelerator", status: "installments_current" }], coachingEndsAt: end }, now)).toEqual({ allowed: true, trialEnd: end });
    expect(eligibility(grad, { ...none, programs: [{ sku: "accelerator", status: "paid" }], coachingEndsAt: new Date("2027-01-01") }, now)).toEqual({ allowed: true });
  });
  it("board retention is for Elite clients only", () => {
    const board = findOffer("elite_board", "monthly")!;
    expect(eligibility(board, { ...none, programs: [{ sku: "accelerator", status: "paid" }] }, now).allowed).toBe(false);
    expect(eligibility(board, { ...none, programs: [{ sku: "elite", status: "paid" }] }, now).allowed).toBe(true);
  });
  it("no duplicate or downgrade purchases", () => {
    expect(eligibility(findOffer("blueprint", "pay_in_full")!, { ...none, programs: [{ sku: "accelerator", status: "paid" }] }, now).allowed).toBe(false);
    expect(eligibility(findOffer("accelerator", "six_installments")!, { ...none, programs: [{ sku: "accelerator", status: "installments_completed" }] }, now).allowed).toBe(false);
    expect(eligibility(findOffer("accelerator", "pay_in_full")!, { ...none, programs: [{ sku: "accelerator", status: "refunded" }] }, now).allowed).toBe(true);
  });
});

describe("checkout parameters", () => {
  const base = { stripePriceId: "price_123", userId: "u-1", customerId: "cus_1", siteUrl: "https://example.test" };
  it("pay in full uses payment mode with metadata on the payment", () => {
    const p = buildCheckoutParams({ ...base, offer: findOffer("accelerator", "pay_in_full")! });
    expect(p).toMatchObject({ mode: "payment", client_reference_id: "u-1", line_items: [{ price: "price_123", quantity: 1 }], payment_intent_data: { metadata: { user_id: "u-1", sku: "accelerator" } } });
    expect(JSON.stringify(p)).not.toMatch(/unit_amount|amount/);
  });
  it("six payments are a disclosed commitment with metadata on the subscription", () => {
    const p = buildCheckoutParams({ ...base, offer: findOffer("elite", "six_installments")! }) as StripeLike;
    expect(p.mode).toBe("subscription");
    expect(p.subscription_data.metadata).toEqual({ user_id: "u-1", sku: "elite", plan: "six_installments" });
    expect(p.custom_text.submit.message).toContain("six monthly payments of $897 ($5,382 total)");
    expect(p.custom_text.submit.message).toMatch(/not a cancel anytime subscription/);
    expect(p.custom_text.submit.message).not.toMatch(/[–—]/);
  });
  it("graduate trial end delays the first charge until coaching ends", () => {
    const end = new Date("2027-06-01T00:00:00Z");
    const p = buildCheckoutParams({ ...base, offer: findOffer("graduate_coaching", "monthly")!, trialEnd: end }) as StripeLike;
    expect(p.subscription_data.trial_end).toBe(end.getTime() / 1000);
    expect(p.custom_text).toBeUndefined();
  });
});
