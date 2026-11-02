"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { buildCheckoutParams, eligibility, findOffer } from "@/domain/billing/offers";
import { isFeatureEnabled, publicEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";
import { loadPurchaseHistory } from "@/lib/server/billing";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { IntegrationNotConfigured } from "@/lib/server/integrations";
import { authorize } from "@/lib/server/session";
import { getStripe } from "@/lib/server/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const NOT_READY = "Online payments are not open yet. Nothing was charged.";

async function ensureCustomer(userId: string, email: string | null): Promise<string> {
  const admin = createSupabaseAdminClient();
  const existing = await admin.from("stripe_customers").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (existing.data?.stripe_customer_id) return existing.data.stripe_customer_id as string;
  const customer = await getStripe().customers.create({ email: email ?? undefined, metadata: { user_id: userId } }, { idempotencyKey: `customer:${userId}` });
  const ins = await admin.from("stripe_customers").insert({ user_id: userId, stripe_customer_id: customer.id });
  if (ins.error && !/duplicate/i.test(ins.error.message)) throw new Error(ins.error.message);
  return customer.id;
}

/** Start Stripe Checkout (test mode until approved). Members sign in first, so access is tied to the account. */
export async function startCheckout(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!isFeatureEnabled("billing")) return errorState(NOT_READY);
  const parsed = z.object({ sku: z.string(), plan: z.string() }).safeParse({ sku: fd.get("sku"), plan: fd.get("plan") });
  const offer = parsed.success ? findOffer(parsed.data.sku, parsed.data.plan) : null;
  if (!offer) return errorState("That plan is not available.");
  let url: string;
  try {
    const { supabase, user } = await authorize(null);
    const history = await loadPurchaseHistory(supabase, user.id);
    const check = eligibility(offer, history, new Date());
    if (!check.allowed) return errorState(check.reason);
    const price = await supabase.from("prices").select("stripe_price_id, amount_cents").eq("sku", offer.sku).eq("plan", offer.plan).single();
    if (price.error || !price.data?.stripe_price_id) return errorState(NOT_READY);
    if (price.data.amount_cents !== offer.amountCents) throw new Error("price mismatch between catalog and database");
    const customerId = await ensureCustomer(user.id, user.email);
    const params = buildCheckoutParams({
      offer,
      stripePriceId: price.data.stripe_price_id as string,
      userId: user.id,
      customerId,
      siteUrl: publicEnv().NEXT_PUBLIC_SITE_URL,
      trialEnd: check.trialEnd,
    });
    const session = await getStripe().checkout.sessions.create(params as Parameters<ReturnType<typeof getStripe>["checkout"]["sessions"]["create"]>[0]);
    if (offer.mode === "payment" || offer.plan === "six_installments") {
      // Record the pending order now; the webhook confirms payment. A redirect is never proof of payment.
      await createSupabaseAdminClient().rpc("billing_apply_checkout", {
        p: { session_id: session.id, user_id: user.id, sku: offer.sku, plan: offer.plan, customer_id: customerId, payment_status: "unpaid", email: user.email },
      });
    }
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    url = session.url;
    logEvent("info", "checkout_started", { sku: offer.sku, plan: offer.plan });
  } catch (err) {
    if (err instanceof IntegrationNotConfigured) return errorState(NOT_READY);
    logEvent("error", "checkout failed", { error: err instanceof Error ? err.message : String(err) });
    return errorState(errorMessage(err, "Checkout could not start. Nothing was charged. Please try again."));
  }
  redirect(url);
}

/** Stripe customer portal for payment methods and invoices. */
export async function openBillingPortal(): Promise<void> {
  let url = "/app/billing?portal=unavailable";
  try {
    const { supabase, user } = await authorize(null);
    const row = await supabase.from("stripe_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (row.data?.stripe_customer_id) {
      const session = await getStripe().billingPortal.sessions.create({
        customer: row.data.stripe_customer_id as string,
        return_url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/app/billing`,
        ...(process.env.STRIPE_PORTAL_CONFIGURATION_ID ? { configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID } : {}),
      });
      url = session.url;
    }
  } catch (err) {
    logEvent("warn", "portal unavailable", { error: err instanceof Error ? err.message : String(err) });
  }
  redirect(url);
}

/** Cancel or resume a month to month membership at period end (D06, D07). Six payment plans cannot be canceled here. */
export async function setMembershipRenewal(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), cancel: z.enum(["true", "false"]) }).safeParse({ id: fd.get("id"), cancel: fd.get("cancel") });
  if (!parsed.success) return errorState("Invalid request.");
  try {
    const { supabase } = await authorize(null);
    const sub = await supabase.from("subscriptions").select("stripe_subscription_id, sku, current_period_end").eq("id", parsed.data.id).maybeSingle();
    if (!sub.data || !["graduate_coaching", "elite_board"].includes(sub.data.sku as string) || !sub.data.stripe_subscription_id) {
      return errorState("That membership was not found.");
    }
    await getStripe().subscriptions.update(sub.data.stripe_subscription_id as string, { cancel_at_period_end: parsed.data.cancel === "true" });
    const end = new Date(sub.data.current_period_end as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return okState(parsed.data.cancel === "true" ? `Canceled. Your access continues through ${end}. This page updates within a minute.` : "Your membership will renew. This page updates within a minute.");
  } catch (err) {
    if (err instanceof IntegrationNotConfigured) return errorState(NOT_READY);
    return errorState(errorMessage(err));
  }
}
