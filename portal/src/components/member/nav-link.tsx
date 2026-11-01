"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold whitespace-nowrap",
        active ? "bg-plum text-white" : "text-ink hover:bg-rose-soft",
      )}
    >
      {children}
    </Link>
  );
}
