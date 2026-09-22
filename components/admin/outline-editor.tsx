"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { api, errorMessage } from "@/lib/client/api";
import { moveId } from "@/lib/order";
import type { ResourceSummaryDTO, SectionDTO } from "@/lib/types";

export type EditorSection = SectionDTO & { resources: Array<ResourceSummaryDTO & { feedbackCount: number }> };

function MoveButtons({
  onMove,
  first,
  last,
  what,
  disabled,
}: {
  onMove: (dir: "up" | "down") => void;
  first: boolean;
  last: boolean;
  what: string;
  disabled: boolean;
}) {
  return (
    <span className="inline-flex gap-1">
      <button type="button" className="btn btn-quiet btn-icon" aria-label={`Subir ${what}`} disabled={first || disabled} onClick={() => onMove("up")}>
        <span aria-hidden="true">↑</span>
      </button>
      <button type="button" className="btn btn-quiet btn-icon" aria-label={`Bajar ${what}`} disabled={last || disabled} onClick={() => onMove("down")}>
        <span aria-hidden="true">↓</span>
      </button>
    </span>
  );
}

export function OutlineEditor({ courseId, sections }: { courseId: string; sections: EditorSection[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);

  /** Ejecuta una mutación, muestra el error si falla y refresca los datos del servidor. */
  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }

  const addSection = (event: React.FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return setError("Escribe un título para la sección.");
    run(async () => {
      await api("POST", "/api/sections", { courseId, title });
      setNewTitle("");
    });
  };

  return (
    <div>
      {error && (
        <p className="notice notice-error mb-4" role="alert">
          {error}
        </p>
      )}
      {sections.length === 0 && (
        <p className="panel mb-6 p-6 text-ink-soft" data-testid="outline-empty">
          Este curso aún no tiene secciones. Añade la primera para empezar a colocar recursos.
        </p>
      )}

      <ol className="route" aria-label="Estructura del curso" aria-busy={pending}>
        {sections.map((section, si) => (
          <SectionItems
            key={section.id}
            section={section}
            index={si}
            total={sections.length}
            pending={pending}
            renaming={renaming?.id === section.id ? renaming : null}
            setRenaming={setRenaming}
            courseId={courseId}
            onMoveSection={(dir) => run(() => api("POST", "/api/sections/reorder", { parentId: courseId, ids: moveId(sections.map((s) => s.id), section.id, dir) }))}
            onRename={(title) =>
              run(async () => {
                await api("PATCH", `/api/sections/${section.id}`, { title });
                setRenaming(null);
              })
            }
            onDeleteSection={() => run(() => api("DELETE", `/api/sections/${section.id}`))}
            onMoveResource={(rid, dir) =>
              run(() => api("POST", "/api/resources/reorder", { parentId: section.id, ids: moveId(section.resources.map((r) => r.id), rid, dir) }))
            }
            onDeleteResource={(rid) => run(() => api("DELETE", `/api/resources/${rid}`))}
          />
        ))}
        <li className="route-item route-action mt-4">
          <form onSubmit={addSection} className="flex flex-wrap items-end gap-2">
            <div className="min-w-56 flex-1">
              <label htmlFor="new-section" className="field-label">
                Nueva sección
              </label>
              <input
                id="new-section"
                className="field"
                value={newTitle}
                maxLength={120}
                placeholder="Título de la sección"
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={pending}>
              Añadir sección
            </button>
          </form>
        </li>
      </ol>
    </div>
  );
}

function SectionItems({
  section,
  index,
  total,
  pending,
  renaming,
  setRenaming,
  courseId,
  onMoveSection,
  onRename,
  onDeleteSection,
  onMoveResource,
  onDeleteResource,
}: {
  section: EditorSection;
  index: number;
  total: number;
  pending: boolean;
  renaming: { id: string; title: string } | null;
  setRenaming: (v: { id: string; title: string } | null) => void;
  courseId: string;
  onMoveSection: (dir: "up" | "down") => void;
  onRename: (title: string) => void;
  onDeleteSection: () => void;
  onMoveResource: (id: string, dir: "up" | "down") => void;
  onDeleteResource: (id: string) => void;
}) {
  return (
    <>
      <li className="route-item route-terminal mt-6 first:mt-0" data-testid="section-item">
        <p className="label">Tramo {index + 1}</p>
        {renaming ? (
          <form
            className="mt-1 flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (renaming.title.trim()) onRename(renaming.title.trim());
            }}
          >
            <label htmlFor={`rename-${section.id}`} className="sr-only">
              Nuevo título de la sección
            </label>
            <input
              id={`rename-${section.id}`}
              className="field max-w-sm"
              value={renaming.title}
              maxLength={120}
              autoFocus
              onChange={(e) => setRenaming({ id: section.id, title: e.target.value })}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
              Guardar
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRenaming(null)}>
              Cancelar
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="heading text-xl" data-testid="section-title">
              {section.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <MoveButtons first={index === 0} last={index === total - 1} what={`la sección ${section.title}`} disabled={pending} onMove={onMoveSection} />
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setRenaming({ id: section.id, title: section.title })}>
                Renombrar
              </button>
              <ConfirmButton
                label="Eliminar"
                ariaLabel={`Eliminar la sección ${section.title}`}
                title="Eliminar sección"
                description={`Se eliminará «${section.title}» con sus ${section.resources.length} recursos y el feedback asociado.`}
                confirmLabel="Sí, eliminar"
                onConfirm={onDeleteSection}
              />
            </div>
          </div>
        )}
      </li>
      {section.resources.map((resource, ri) => (
        <li key={resource.id} className="route-item" data-testid="resource-item">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="stop-number">
                {index + 1}.{ri + 1}
              </span>{" "}
              <Link
                href={`/admin/courses/${courseId}/resources/${resource.id}`}
                className="font-bold text-ink underline decoration-rule underline-offset-4 hover:decoration-line"
              >
                {resource.title}
              </Link>
              {resource.feedbackCount > 0 && (
                <span className="badge ml-2">
                  {resource.feedbackCount} {resource.feedbackCount === 1 ? "comentario" : "comentarios"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MoveButtons
                first={ri === 0}
                last={ri === section.resources.length - 1}
                what={`el recurso ${resource.title}`}
                disabled={pending}
                onMove={(dir) => onMoveResource(resource.id, dir)}
              />
              <ConfirmButton
                label="Eliminar"
                ariaLabel={`Eliminar el recurso ${resource.title}`}
                title="Eliminar recurso"
                description={`Se eliminará «${resource.title}» y el feedback que recibió.`}
                confirmLabel="Sí, eliminar"
                onConfirm={() => onDeleteResource(resource.id)}
              />
            </div>
          </div>
        </li>
      ))}
      <li className="route-item route-action">
        <Link
          href={`/admin/courses/${courseId}/resources/new?sectionId=${section.id}`}
          className="btn btn-quiet btn-sm"
          aria-label={`Añadir recurso a ${section.title}`}
        >
          + Añadir recurso
        </Link>
      </li>
    </>
  );
}
