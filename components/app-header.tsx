import Link from "next/link";
import type { Session } from "@/lib/auth/session";
import { NavLink } from "./nav-link";
import { Wordmark } from "./wordmark";

export interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

/** Cabecera de las áreas autenticadas: navegación, usuario y cierre de sesión. */
export function AppHeader({
  session,
  area,
  nav,
  crossLink,
}: {
  session: Session;
  area: "Administración" | "Alumno";
  nav: NavItem[];
  crossLink?: { href: string; label: string };
}) {
  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Wordmark href={session.role === "admin" && area === "Administración" ? "/admin" : "/student"} />
        <span className="label hidden sm:inline">{area}</span>
        <nav aria-label={area} className="flex flex-1 items-center gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} exact={item.exact}>
              {item.label}
            </NavLink>
          ))}
          {crossLink && (
            <Link href={crossLink.href} className="ml-auto px-3 py-2 text-sm font-semibold text-muted no-underline hover:text-ink">
              {crossLink.label}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <p className="hidden text-right leading-tight sm:block" data-testid="user-chip">
            <span className="block text-sm font-bold">{session.name}</span>
            <span className="block text-xs text-muted">{session.email}</span>
          </p>
          <form method="post" action="/api/auth/logout">
            <button type="submit" className="btn btn-quiet btn-sm">
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
