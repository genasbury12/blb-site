import "server-only";
import type { PurchaseHistory, Sku } from "@/domain/billing/offers";
import type { UserSupabase } from "@/lib/supabase/server";
import { latestEnd, loadGrants } from "./learning";

export async function loadPurchaseHistory(supabase: UserSupabase, userId: string): Promise<PurchaseHistory> {
  const [orders, subs, grants, elite] = await Promise.all([
    supabase.from("orders").select("sku, status").eq("user_id", userId),
    supabase.from("subscriptions").select("sku, status, current_period_end").eq("user_id", userId),
    loadGrants(supabase, userId),
    supabase.rpc("my_elite_checkout_allowed"),
  ]);
  const now = Date.now();
  return {
    programs: (orders.data ?? []).map((o) => ({ sku: o.sku as Sku, status: o.status as string })),
    activeSubscriptions: (subs.data ?? [])
      .filter((s) => ["active", "trialing", "past_due"].includes(s.status as string) && new Date(s.current_period_end as string).getTime() > now)
      .map((s) => s.sku as Sku),
    coachingEndsAt: latestEnd(grants, "group_coaching.access"),
    boardEndsAt: latestEnd(grants, "elite_board.access"),
    eliteAccepted: elite.data === true,
  };
}
