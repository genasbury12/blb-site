/**
 * Purchasable offers (D04). Amounts here are for display only; checkout always uses the server side
 * price row and its Stripe price id, never a client total.
 */
export type Sku = "blueprint" | "accelerator" | "elite" | "graduate_coaching" | "elite_board";
export type Plan = "pay_in_full" | "six_installments" | "monthly";

export type Offer = {
  sku: Sku;
  plan: Plan;
  name: string;
  amountCents: number;
  installments: number;
  mode: "payment" | "subscription";
};

export const OFFERS: Offer[] = [
  { sku: "blueprint", plan: "pay_in_full", name: "BOSS Blueprint", amountCents: 49700, installments: 1, mode: "payment" },
  { sku: "blueprint", plan: "six_installments", name: "BOSS Blueprint", amountCents: 9700, installments: 6, mode: "subscription" },
  { sku: "accelerator", plan: "pay_in_full", name: "BOSS Accelerator", amountCents: 149700, installments: 1, mode: "payment" },
  { sku: "accelerator", plan: "six_installments", name: "BOSS Accelerator", amountCents: 29700, installments: 6, mode: "subscription" },
  { sku: "elite", plan: "pay_in_full", name: "BOSS Elite", amountCents: 499700, installments: 1, mode: "payment" },
  { sku: "elite", plan: "six_installments", name: "BOSS Elite", amountCents: 89700, installments: 6, mode: "subscription" },
  { sku: "graduate_coaching", plan: "monthly", name: "Graduate Coaching Membership", amountCents: 9700, installments: 0, mode: "subscription" },
  { sku: "elite_board", plan: "monthly", name: "Elite Board Retention", amountCents: 9700, installments: 0, mode: "subscription" },
];

export function findOffer(sku: string, plan: string): Offer | null {
  return OFFERS.find((o) => o.sku === sku && o.plan === plan) ?? null;
}

export const dollars = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);

export function offerTotalCents(o: Offer): number {
  return o.plan === "six_installments" ? o.amountCents * 6 : o.amountCents;
}

/** Purchase history the eligibility rules need, built on the server from the member's own orders. */
export type PurchaseHistory = {
  programs: { sku: Sku; status: string }[];
  activeSubscriptions: Sku[];
  coachingEndsAt: Date | null;
  boardEndsAt: Date | null;
  eliteAccepted: boolean;
};

const PAID = new Set(["paid", "installments_current", "installments_past_due", "installments_completed"]);

export type Eligibility = { allowed: true; trialEnd?: Date } | { allowed: false; reason: string };

/**
 * Eligibility (I-32, decided 2026-11-02):
 * - Blueprint and Accelerator are open to any signed in account without an active program purchase of the same tier.
 * - Elite requires an accepted application (application, discovery, acceptance, then checkout).
 * - Graduate requires an Accelerator or Elite purchase. If coaching is still active, billing starts when it ends.
 * - Board retention requires an Elite purchase. If the board is still active, billing starts when it ends.
 */
export function eligibility(offer: Offer, h: PurchaseHistory, now: Date): Eligibility {
  const owns = (sku: Sku) => h.programs.some((p) => p.sku === sku && PAID.has(p.status));
  if (offer.sku === "blueprint" || offer.sku === "accelerator") {
    if (owns(offer.sku)) return { allowed: false, reason: "You already have this program." };
    if (offer.sku === "blueprint" && (owns("accelerator") || owns("elite"))) return { allowed: false, reason: "Your program already includes everything in Blueprint." };
    if (offer.sku === "accelerator" && owns("elite")) return { allowed: false, reason: "Your program already includes everything in Accelerator." };
    return { allowed: true };
  }
  if (offer.sku === "elite") {
    if (owns("elite")) return { allowed: false, reason: "You already have this program." };
    if (!h.eliteAccepted) return { allowed: false, reason: "Elite begins with an application and a conversation. Checkout opens once your application is accepted." };
    return { allowed: true };
  }
  if (h.activeSubscriptions.includes(offer.sku)) return { allowed: false, reason: "This membership is already active." };
  if (offer.sku === "graduate_coaching") {
    if (!owns("accelerator") && !owns("elite")) return { allowed: false, reason: "Graduate coaching is for members who have completed Accelerator or Elite coaching." };
    return h.coachingEndsAt && h.coachingEndsAt > now ? { allowed: true, trialEnd: h.coachingEndsAt } : { allowed: true };
  }
  if (offer.sku === "elite_board") {
    if (!owns("elite")) return { allowed: false, reason: "Board retention is for Elite clients." };
    return h.boardEndsAt && h.boardEndsAt > now ? { allowed: true, trialEnd: h.boardEndsAt } : { allowed: true };
  }
  return { allowed: false, reason: "Not available." };
}

/**
 * Checkout session parameters. Pure so it can be tested: no amounts from the client, metadata on the
 * session, the payment, and the subscription so every webhook can be tied back to the member and offer.
 */
export function buildCheckoutParams(input: {
  offer: Offer;
  stripePriceId: string;
  userId: string;
  customerId: string;
  siteUrl: string;
  trialEnd?: Date;
}) {
  const metadata = { user_id: input.userId, sku: input.offer.sku, plan: input.offer.plan };
  const base = {
    mode: input.offer.mode,
    customer: input.customerId,
    client_reference_id: input.userId,
    line_items: [{ price: input.stripePriceId, quantity: 1 }],
    metadata,
    success_url: `${input.siteUrl}/app/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.siteUrl}/app/plans?checkout=canceled`,
    allow_promotion_codes: false,
  };
  if (input.offer.mode === "payment") {
    return { ...base, payment_intent_data: { metadata } };
  }
  const trial = input.trialEnd ? { trial_end: Math.floor(input.trialEnd.getTime() / 1000) } : {};
  const commitment =
    input.offer.plan === "six_installments"
      ? {
          custom_text: {
            submit: {
              message: `You are committing to six monthly payments of ${dollars(input.offer.amountCents)} (${dollars(offerTotalCents(input.offer))} total). This is a fixed payment plan, not a cancel anytime subscription. Billing stops after the sixth payment.`,
            },
          },
        }
      : {};
  return { ...base, ...commitment, subscription_data: { metadata, ...trial } };
}
