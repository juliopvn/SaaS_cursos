"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/client/api";
import type { FeedbackDTO } from "@/lib/types";

const MAX = 2000;
const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function FeedbackForm({ resourceId, initial }: { resourceId: string; initial: FeedbackDTO[] }) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return; // protección contra doble envío
    const value = text.trim();
    setSent(false);
    if (!value) return setError("Escribe tu comentario antes de enviarlo.");
    if (value.length > MAX) return setError(`El comentario no puede superar los ${MAX} caracteres.`);

    setBusy(true);
    setError(null);
    try {
      const { feedback } = await api<{ feedback: FeedbackDTO }>("POST", "/api/feedback", { resourceId, text: value });
      setItems((prev) => [feedback, ...prev]);
      setText("");
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="feedback-title" className="panel p-6" data-testid="feedback-section">
      <h2 id="feedback-title" className="heading text-2xl">
        ¿Qué te ha parecido este recurso?
      </h2>
      <p className="mt-1 text-ink-soft">Tu opinión llega a quien mantiene el curso y ayuda a mejorarlo.</p>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
        <div>
          <label htmlFor="feedback-text" className="field-label">
            Tu comentario
          </label>
          <textarea
            id="feedback-text"
            className="field min-h-28"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSent(false);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "feedback-error" : "feedback-count"}
          />
          <div className="mt-1 flex justify-between gap-4">
            {error ? (
              <p id="feedback-error" className="field-error" role="alert">
                {error}
              </p>
            ) : (
              <span />
            )}
            <p id="feedback-count" className={`field-hint mt-1.5 tabular-nums ${text.length > MAX ? "text-alert" : ""}`}>
              {text.length}/{MAX}
            </p>
          </div>
        </div>
        {sent && (
          <p className="notice notice-ok" role="status">
            Gracias, hemos recibido tu comentario.
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Enviando…" : "Enviar comentario"}
        </button>
      </form>

      {items.length > 0 && (
        <div className="mt-8 border-t border-rule pt-6">
          <h3 className="label mb-3">Tus comentarios en este recurso</h3>
          <ul className="space-y-3" data-testid="own-feedback">
            {items.map((item) => (
              <li key={item.id} className="rounded-[var(--radius-sign)] bg-paper p-4">
                <p className="whitespace-pre-wrap break-words">{item.text}</p>
                <p className="mt-2 font-mono text-xs text-muted">{dateFormat.format(new Date(item.createdAt))}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
