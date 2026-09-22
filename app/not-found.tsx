import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <main id="contenido" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-4 py-16">
      <Wordmark />
      <div>
        <p className="label">Error 404</p>
        <h1 className="display mt-3 text-5xl">Esta parada no existe.</h1>
        <p className="mt-4 text-lg text-ink-soft">
          La página que buscas no está en la línea: puede que se haya movido, que no esté publicada o que la dirección tenga un error.
        </p>
        <Link href="/" className="btn btn-primary mt-8">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
