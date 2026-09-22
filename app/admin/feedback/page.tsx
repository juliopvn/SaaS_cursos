import type { Metadata } from "next";
import Link from "next/link";
import { listCourses } from "@/lib/repositories/courses";
import { listFeedbackDetailed } from "@/lib/repositories/feedback";
import { getOutline } from "@/lib/repositories/outline";
import { objectId } from "@/lib/validators";

export const metadata: Metadata = { title: "Feedback" };
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ courseId?: string; resourceId?: string }> }) {
  const raw = await searchParams;
  const courseId = objectId.safeParse(raw.courseId).data;
  const resourceId = objectId.safeParse(raw.resourceId).data;

  const courses = await listCourses();
  const selectedCourse = courses.find((c) => c.id === courseId);
  const [feedback, outline] = await Promise.all([
    listFeedbackDetailed({ courseId: selectedCourse?.id, resourceId }),
    selectedCourse ? getOutline(selectedCourse) : null,
  ]);
  const resourceOptions = outline?.sections.flatMap((s) => s.resources) ?? [];

  return (
    <>
      <p className="label">Administración</p>
      <h1 className="heading mt-1 text-4xl">Feedback de los alumnos</h1>
      <p className="mt-2 max-w-prose text-ink-soft">Qué recursos funcionan y cuáles no, ordenado del comentario más reciente al más antiguo.</p>

      <form method="get" className="panel mt-8 flex flex-wrap items-end gap-4 p-4" aria-label="Filtros">
        <div className="min-w-56 flex-1">
          <label htmlFor="filter-course" className="field-label">
            Curso
          </label>
          <select id="filter-course" name="courseId" className="field" defaultValue={selectedCourse?.id ?? ""}>
            <option value="">Todos los cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        {selectedCourse && (
          <div className="min-w-56 flex-1">
            <label htmlFor="filter-resource" className="field-label">
              Recurso
            </label>
            <select id="filter-resource" name="resourceId" className="field" defaultValue={resourceId ?? ""}>
              <option value="">Todos los recursos</option>
              {resourceOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn btn-secondary">
          Filtrar
        </button>
        {(selectedCourse || resourceId) && (
          <Link href="/admin/feedback" className="btn btn-quiet">
            Quitar filtros
          </Link>
        )}
      </form>

      {feedback.length === 0 ? (
        <div className="panel mt-8 p-8" data-testid="feedback-empty">
          <h2 className="heading text-2xl">No hay comentarios con estos filtros</h2>
          <p className="mt-2 text-ink-soft">Cuando un alumno deje feedback en un recurso, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border-y border-rule bg-surface">
          <table className="w-full min-w-[46rem] text-left text-sm" data-testid="feedback-table">
            <caption className="sr-only">Comentarios de los alumnos por recurso</caption>
            <thead>
              <tr className="border-b-2 border-ink">
                <th scope="col" className="label px-4 py-3">Recurso</th>
                <th scope="col" className="label px-4 py-3">Alumno</th>
                <th scope="col" className="label px-4 py-3">Comentario</th>
                <th scope="col" className="label px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {feedback.map((f) => (
                <tr key={f.id} data-testid="feedback-row" className="align-top">
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${f.courseId}/resources/${f.resourceId}`} className="font-bold">
                      {f.resourceTitle}
                    </Link>
                    <span className="block text-xs text-muted">{f.courseTitle}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-bold">{f.userName}</span>
                    <span className="block text-xs text-muted">{f.userEmail}</span>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p className="whitespace-pre-wrap break-words">{f.text}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{dateFormat.format(new Date(f.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
