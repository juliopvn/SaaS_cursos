import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { defaultHome } from "@/lib/auth/next-path";
import { getSession } from "@/lib/auth/session";
import { isSafeNext } from "@/lib/validators";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  invalid_link: "Ese enlace ha caducado o ya se usó. Pide uno nuevo para entrar.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const session = await getSession();
  if (session) redirect(defaultHome(session.role));

  return (
    <>
      <SiteHeader />
      <main id="contenido" className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_28rem] md:py-20">
        <section aria-labelledby="login-title" className="md:order-2">
          <div className="panel p-6 sm:p-8">
            <h1 id="login-title" className="heading text-3xl">
              Entrar en Cursos
            </h1>
            <p className="mt-2 text-ink-soft">Escribe tu email y te enviamos un enlace para entrar.</p>
            {error && ERRORS[error] && (
              <p className="notice notice-error mt-6" role="alert">
                {ERRORS[error]}
              </p>
            )}
            <div className="mt-6">
              <LoginForm next={isSafeNext(next) ? next : undefined} />
            </div>
          </div>
        </section>
        <section aria-hidden="true" className="hidden md:order-1 md:block">
          <p className="label">Acceso</p>
          <p className="display mt-4 max-w-[12ch]">Una parada más.</p>
          <p className="mt-6 max-w-sm text-lg text-ink-soft">
            Vuelve donde lo dejaste: tus cursos, en el mismo orden en que se enseñan.
          </p>
        </section>
      </main>
    </>
  );
}
