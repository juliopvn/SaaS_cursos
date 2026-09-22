import type { Metadata } from "next";
import Link from "next/link";
import { listCourses } from "@/lib/repositories/courses";

export const metadata: Metadata = { title: "Cursos" };
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminCoursesPage() {
  const courses = await listCourses();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Administración</p>
          <h1 className="heading mt-1 text-4xl">Cursos</h1>
        </div>
        <Link href="/admin/courses/new" className="btn btn-primary">
          Nuevo curso
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="panel mt-8 p-8" data-testid="courses-empty">
          <h2 className="heading text-2xl">Todavía no hay cursos</h2>
          <p className="mt-2 max-w-prose text-ink-soft">
            Crea el primero: dale un título, añade secciones y coloca los recursos en el orden en que quieres que se estudien.
          </p>
          <Link href="/admin/courses/new" className="btn btn-primary mt-6">
            Crear el primer curso
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule bg-surface" data-testid="course-list">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/admin/courses/${course.id}`}
                className="group flex flex-wrap items-center justify-between gap-3 px-4 py-4 no-underline hover:bg-line-tint sm:px-5"
              >
                <div className="min-w-0">
                  <p className="heading text-xl group-hover:text-line">{course.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">/{course.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-sm text-muted sm:inline">Actualizado {dateFormat.format(new Date(course.updatedAt))}</span>
                  <span className={`badge ${course.published ? "badge-live" : ""}`}>{course.published ? "Publicado" : "Borrador"}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
