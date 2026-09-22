"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/client/api";
import { slugify } from "@/lib/slug";
import type { CourseDTO } from "@/lib/types";

export function CourseForm({ course }: { course?: CourseDTO }) {
  const router = useRouter();
  const [title, setTitle] = useState(course?.title ?? "");
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(course));
  const [description, setDescription] = useState(course?.description ?? "");
  const [published, setPublished] = useState(course?.published ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const payload = { title, slug, description, published };
      if (course) {
        await api("PATCH", `/api/courses/${course.id}`, payload);
        setSaved(true);
        router.refresh();
      } else {
        const { course: created } = await api<{ course: CourseDTO }>("POST", "/api/courses", payload);
        router.push(`/admin/courses/${created.id}`);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="course-title" className="field-label">
          Título
        </label>
        <input
          id="course-title"
          className="field"
          value={title}
          maxLength={120}
          required
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div>
        <label htmlFor="course-slug" className="field-label">
          Slug
        </label>
        <input
          id="course-slug"
          className="field font-mono text-sm"
          value={slug}
          maxLength={80}
          required
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <p className="field-hint">Es la dirección del curso: /student/courses/{slug || "slug"}. Se genera desde el título.</p>
      </div>
      <div>
        <label htmlFor="course-description" className="field-label">
          Descripción
        </label>
        <textarea
          id="course-description"
          className="field min-h-28"
          value={description}
          maxLength={1000}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="mt-1 size-5 accent-line"
        />
        <span>
          <span className="block font-bold">Publicado</span>
          <span className="block text-sm text-muted">Los alumnos solo ven los cursos publicados.</span>
        </span>
      </label>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="notice notice-ok" role="status">
          Cambios guardados.
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Guardando…" : course ? "Guardar cambios" : "Crear curso"}
      </button>
    </form>
  );
}
