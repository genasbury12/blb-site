import { signOutAction } from "@/app/(auth)/actions";
import { NavLink } from "@/components/member/nav-link";
import { isFeatureEnabled } from "@/lib/env";
import { visibleNav } from "@/lib/features";
import { getFeatures, getSession } from "@/lib/server/session";

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
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} icon={item.icon} exact={item.href === "/app"}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export async function MemberFooter() {
  const session = await getSession();
  const { data: roles } = session ? await session.supabase.from("user_roles").select("role").eq("user_id", session.user.id) : { data: [] };
  const staff = (roles ?? []).length > 0;
  return (
    <div className="space-y-2 text-sm">
      {staff ? (
        <a href="/admin" className="block rounded-lg px-3 py-2 font-semibold text-plum hover:bg-white">
          Open admin workspace
        </a>
      ) : null}
      <form action={signOutAction}>
        <button type="submit" className="min-h-11 w-full rounded-lg px-3 text-left font-semibold text-ink-muted hover:bg-white hover:text-plum">
          Sign out
        </button>
      </form>
    </div>
  );
}
