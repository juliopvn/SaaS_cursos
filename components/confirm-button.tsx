"use client";

import { useId, useRef, useState } from "react";

/** Botón que pide confirmación en un diálogo nativo (<dialog>: foco atrapado y Esc de serie). */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  className = "btn btn-danger btn-sm",
  ariaLabel,
}: {
  label: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  className?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      ref.current?.close();
    }
  }

  return (
    <>
      <button type="button" className={className} aria-label={ariaLabel} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog ref={ref} className="dialog" aria-labelledby={titleId}>
        <h2 id={titleId} className="heading text-xl">
          {title}
        </h2>
        <p className="mt-2 text-ink-soft">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-quiet" onClick={() => ref.current?.close()} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy}>
            {busy ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
