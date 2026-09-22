"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="contenido" className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center px-4 py-16">
      <p className="label">Error</p>
      <h1 className="display mt-3 text-5xl">Algo se ha descarrilado.</h1>
      <p className="mt-4 text-lg text-ink-soft">
        No pudimos cargar esta página. Inténtalo de nuevo; si el problema sigue, vuelve al inicio.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">Ref. {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Reintentar
        </button>
        <a href="/" className="btn btn-quiet">
          Ir al inicio
        </a>
      </div>
    </main>
  );
}
