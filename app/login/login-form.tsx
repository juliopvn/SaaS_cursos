"use client";

import { useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ next }: { next?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "sending") return;
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    if (!email) return setFieldError("Introduce tu email.");
    if (!EMAIL_PATTERN.test(email)) return setFieldError("Introduce un email válido, como nombre@dominio.com.");
    setFieldError(null);
    setState({ kind: "sending" });

    try {
      const response = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      if (response.ok) return setState({ kind: "sent", email });
      const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      setState({ kind: "error", message: body?.error?.message ?? "No pudimos enviar el enlace. Inténtalo de nuevo." });
    } catch {
      setState({ kind: "error", message: "Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo." });
    }
  }

  if (state.kind === "sent") {
    return (
      <div role="status" className="notice notice-ok">
        <p className="font-bold">Revisa tu correo</p>
        <p className="mt-1">
          Si <strong>{state.email}</strong> es correcto, te hemos enviado un enlace para entrar. Caduca en unos minutos y
          solo funciona una vez.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nombre@dominio.com"
          className="field"
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "email-error" : "email-hint"}
        />
        {fieldError ? (
          <p id="email-error" className="field-error" role="alert">
            {fieldError}
          </p>
        ) : (
          <p id="email-hint" className="field-hint">
            Sin contraseña: te enviamos un enlace de un solo uso.
          </p>
        )}
      </div>
      {state.kind === "error" && (
        <p className="notice notice-error" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={state.kind === "sending"}>
        {state.kind === "sending" ? "Enviando enlace…" : "Enviarme el enlace"}
      </button>
    </form>
  );
}
