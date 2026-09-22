import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { defaultHome } from "@/lib/auth/next-path";
import { Wordmark } from "./wordmark";

/** Cabecera de las páginas públicas (landing y login). */
export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Principal">
          {session ? (
            <Link href={defaultHome(session.role)} className="btn btn-secondary btn-sm">
              Ir a mi panel
            </Link>
          ) : (
            <Link href="/login" className="btn btn-secondary btn-sm">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
