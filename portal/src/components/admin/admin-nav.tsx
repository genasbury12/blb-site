import { signOutAction } from "@/app/(auth)/actions";
import { NavLink } from "@/components/member/nav-link";
import { getStaffRoles } from "@/lib/server/staff";

const ITEMS: { href: string; label: string; icon: string; roles: ("admin" | "coach")[] }[] = [
  { href: "/admin", label: "Overview", icon: "dashboard", roles: ["admin", "coach"] },
  { href: "/admin/students", label: "Students & access", icon: "students", roles: ["admin", "coach"] },
  { href: "/admin/catalog", label: "Curriculum", icon: "catalog", roles: ["admin", "coach"] },
  { href: "/admin/library", label: "Library", icon: "library", roles: ["admin"] },
  { href: "/admin/coaching", label: "Coaching & Hot Seat", icon: "coaching", roles: ["admin", "coach"] },
  { href: "/admin/workshops", label: "Workshops", icon: "workshops", roles: ["admin"] },
  { href: "/admin/feedback", label: "Feedback queue", icon: "feedback", roles: ["admin", "coach"] },
  { href: "/admin/community", label: "Community moderation", icon: "community", roles: ["admin", "coach"] },
  { href: "/admin/elite", label: "Elite clients", icon: "elite", roles: ["admin", "coach"] },
  { href: "/admin/billing", label: "Payments", icon: "billing", roles: ["admin"] },
  { href: "/admin/audit-log", label: "Audit log", icon: "log", roles: ["admin"] },
];

export async function AdminNav() {
  const roles = await getStaffRoles();
  const items = ITEMS.filter((i) => i.roles.some((r) => roles.includes(r)));
  return (
    <nav aria-label="Admin">
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.href}>
            <NavLink href={i.href} icon={i.icon} exact={i.href === "/admin"}>
              {i.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminFooter() {
  return (
    <div className="space-y-2 text-sm">
      <a href="/app" className="block rounded-lg px-3 py-2 font-semibold text-plum hover:bg-white">
        View member portal
      </a>
      <form action={signOutAction}>
        <button type="submit" className="min-h-11 w-full rounded-lg px-3 text-left font-semibold text-ink-muted hover:bg-white hover:text-plum">
          Sign out
        </button>
      </form>
    </div>
  );
}
