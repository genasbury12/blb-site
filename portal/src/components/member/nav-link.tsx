"use client";

import {
  BookOpen,
  ClipboardCheck,
  CreditCard,
  Gem,
  GraduationCap,
  LayoutDashboard,
  Library,
  Map,
  MessageCircleHeart,
  MessagesSquare,
  NotebookPen,
  ScrollText,
  Settings2,
  Sparkles,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  training: BookOpen,
  audit: ClipboardCheck,
  roadmap: Map,
  library: Library,
  coaching: Video,
  workshops: GraduationCap,
  community: MessagesSquare,
  feedback: MessageCircleHeart,
  elite: Gem,
  account: Settings2,
  students: Users,
  catalog: NotebookPen,
  billing: CreditCard,
  log: ScrollText,
  sparkles: Sparkles,
};

export function NavLink({ href, icon, exact, children }: { href: string; icon?: string; exact?: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icon ? ICONS[icon] : undefined;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.92rem] font-medium transition-colors",
        active ? "bg-plum text-white shadow-[0_10px_24px_-14px_rgba(101,71,79,0.9)]" : "text-ink hover:bg-white hover:text-plum",
      )}
    >
      {Icon ? <Icon className={cn("size-[18px] shrink-0", active ? "text-white" : "text-mauve-ink group-hover:text-plum")} aria-hidden /> : null}
      <span>{children}</span>
    </Link>
  );
}
