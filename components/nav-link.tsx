"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-[var(--radius-sign)] px-3 py-2 text-sm font-bold no-underline transition-colors ${
        active ? "bg-ink text-white" : "text-ink-soft hover:bg-line-tint hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
