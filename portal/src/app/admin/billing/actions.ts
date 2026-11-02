"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { errorMessage, errorState, okState, type FormState } from "@/lib/server/form-result";
import { authorizeStaff } from "@/lib/server/staff";

export async function setStripePriceId(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ id: z.string().uuid(), stripe_price_id: z.string().trim().regex(/^(price_[A-Za-z0-9]+)?$/, "Paste a Stripe price ID that starts with price_") })
    .safeParse({ id: fd.get("id"), stripe_price_id: fd.get("stripe_price_id") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Invalid price ID.");
  try {
    const { supabase } = await authorizeStaff(["admin"]);
    const { error } = await supabase.from("prices").update({ stripe_price_id: parsed.data.stripe_price_id || null }).eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/billing");
  return okState("Saved. Checkout uses this Stripe price from now on.");
}

export async function resolveBillingException(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ id: z.string().uuid(), note: z.string().trim().min(5, "Add a short note about what you did.").max(1000) }).safeParse({ id: fd.get("id"), note: fd.get("note") });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Invalid request.");
  try {
    const { supabase, user } = await authorizeStaff(["admin"]);
    const { error } = await supabase
      .from("billing_exceptions")
      .update({ resolved_at: new Date().toISOString(), resolved_by: user.id, resolution_note: parsed.data.note })
      .eq("id", parsed.data.id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return errorState(errorMessage(err));
  }
  revalidatePath("/admin/billing");
  return okState("Marked resolved.");
}
