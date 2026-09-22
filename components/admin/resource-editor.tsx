"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { Markdown } from "@/components/markdown";
import { api, errorMessage } from "@/lib/client/api";
import type { ResourceDTO } from "@/lib/types";

type View = "write" | "preview";

export function ResourceEditor({
  courseId,
  sectionId,
  sectionTitle,
  resource,
}: {
  courseId: string;
  sectionId: string;
  sectionTitle: string;
  resource?: ResourceDTO;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(resource?.title ?? "");
  const [content, setContent] = useState(resource?.content ?? "");
  const [view, setView] = useState<View>("write");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      if (resource) {
        await api("PATCH", `/api/resources/${resource.id}`, { title, content });
        setSaved(true);
        router.refresh();
      } else {
        const { resource: created } = await api<{ resource: ResourceDTO }>("POST", "/api/resources", { sectionId, title, content });
        router.replace(`/admin/courses/${courseId}/resources/${created.id}`);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <label htmlFor="resource-title" className="field-label">
          Título del recurso
        </label>
        <input
          id="resource-title"
          className="field text-lg font-bold"
          value={title}
          maxLength={160}
          required
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="field-hint">Sección: {sectionTitle}</p>
      </div>

      <div role="tablist" aria-label="Modo del editor" className="flex gap-1 lg:hidden">
        {(["write", "preview"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            className={`btn btn-sm ${view === v ? "btn-secondary" : "btn-quiet"}`}
            onClick={() => setView(v)}
          >
            {v === "write" ? "Escribir" : "Vista previa"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={view === "preview" ? "hidden lg:block" : ""}>
          <label htmlFor="resource-content" className="field-label">
            Contenido (Markdown)
          </label>
          <textarea
            id="resource-content"
            className="field min-h-[28rem] font-mono text-sm leading-relaxed"
            value={content}
            spellCheck={false}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"# Título\n\nEscribe en Markdown. Para un vídeo:\n<iframe src=\"https://www.youtube.com/embed/ID\" title=\"Vídeo\"></iframe>"}
          />
          <p className="field-hint">Admite tablas, listas de tareas, código y vídeos de YouTube embebidos.</p>
        </div>
        <div className={view === "write" ? "hidden lg:block" : ""}>
          <p className="field-label" id="preview-label">
            Vista previa
          </p>
          <div
            className="panel min-h-[28rem] overflow-auto p-5"
            role="region"
            aria-labelledby="preview-label"
            data-testid="markdown-preview"
          >
            {content.trim() ? <Markdown>{content}</Markdown> : <p className="text-muted">La vista previa aparece aquí mientras escribes.</p>}
          </div>
        </div>
      </div>

      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="notice notice-ok" role="status">
          Recurso guardado.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Guardando…" : resource ? "Guardar cambios" : "Crear recurso"}
        </button>
        <Link href={`/admin/courses/${courseId}`} className="btn btn-quiet">
          Volver al curso
        </Link>
        {resource && (
          <ConfirmButton
            className="btn btn-danger ml-auto"
            label="Eliminar recurso"
            title="Eliminar recurso"
            description={`Se eliminará «${resource.title}» y el feedback que recibió.`}
            confirmLabel="Sí, eliminar"
            onConfirm={async () => {
              try {
                await api("DELETE", `/api/resources/${resource.id}`);
                router.push(`/admin/courses/${courseId}`);
                router.refresh();
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          />
        )}
      </div>
    </form>
  );
}
