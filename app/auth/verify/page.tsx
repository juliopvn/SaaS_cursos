import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: "Confirmar acceso", robots: { index: false } };

/**
 * El enlace del correo solo abre esta página. El token se gasta al pulsar "Continuar" (POST),
 * para que escáneres de correo y previsualizadores no lo consuman.
 */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);

  return (
    <main id="contenido" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12">
      <Wordmark />
      <div className="panel p-6 sm:p-8">
        {valid ? (
          <>
            <h1 className="heading text-3xl">Confirma tu acceso</h1>
            <p className="mt-2 text-ink-soft">Pulsa el botón para iniciar sesión en este dispositivo.</p>
            <form method="post" action="/api/auth/verify" className="mt-6">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="btn btn-primary w-full">
                Continuar
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="heading text-3xl">Enlace no válido</h1>
            <p className="mt-2 text-ink-soft">Falta el código de acceso o el enlace está incompleto.</p>
            <Link href="/login" className="btn btn-primary mt-6 w-full">
              Pedir un enlace nuevo
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
