import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { isFeatureEnabled } from "@/lib/env";
import { visibleNav } from "@/lib/features";
import { getFeatures } from "@/lib/server/session";
import { NavLink } from "./nav-link";

export async function MemberNav() {
  const features = await getFeatures();
  const items = visibleNav(features, {
    coaching: isFeatureEnabled("coaching"),
    community: isFeatureEnabled("community"),
    feedback: isFeatureEnabled("feedback"),
    elite: isFeatureEnabled("elite"),
  });
  return (
    <nav aria-label="Member">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <NavLink href={item.href}>{item.label}</NavLink>
          </li>
        ))}
      </ul>
      <form action={signOutAction} className="mt-2 lg:mt-6">
        <button type="submit" className="min-h-11 rounded-lg px-3 text-sm font-semibold text-plum underline-offset-4 hover:underline">
          Sign out
        </button>
      </form>
      <p className="sr-only">
        <Link href="/app/account">Account and access dates</Link>
      </p>
    </nav>
  );
}
