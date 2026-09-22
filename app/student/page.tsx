import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listCourses } from "@/lib/repositories/courses";
import { getOutline } from "@/lib/repositories/outline";

export const metadata: Metadata = { title: "Mis cursos" };
export const dynamic = "force-dynamic";

export default async function StudentHome() {
  const [session, courses] = await Promise.all([getSession(), listCourses({ onlyPublished: true })]);
  const outlines = await Promise.all(courses.map(getOutline));

  return (
    <>
      <p className="label">Hola, {session?.name}</p>
      <h1 className="heading mt-1 text-4xl">Cursos disponibles</h1>

      {courses.length === 0 ? (
        <div className="panel mt-8 p-8" data-testid="student-empty">
          <h2 className="heading text-2xl">Aún no hay cursos publicados</h2>
          <p className="mt-2 max-w-prose text-ink-soft">Cuando se publique el primero aparecerá aquí. Vuelve en un rato.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 md:grid-cols-2" data-testid="course-grid">
          {outlines.map(({ course, sections }) => {
            const stops = sections.reduce((n, s) => n + s.resources.length, 0);
            const first = sections.flatMap((s) => s.resources)[0];
            return (
              <li key={course.id} className="panel flex flex-col p-6" data-testid="course-card">
                <p className="label">
                  {sections.length} {sections.length === 1 ? "tramo" : "tramos"} · {stops} {stops === 1 ? "parada" : "paradas"}
                </p>
                <h2 className="heading mt-2 text-2xl">
                  <Link href={`/student/courses/${course.slug}`} className="text-ink no-underline hover:text-line">
                    {course.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-ink-soft">{course.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/student/courses/${course.slug}`} className="btn btn-primary btn-sm">
                    Ver curso
                  </Link>
                  {first && (
                    <Link href={`/student/courses/${course.slug}/${first.id}`} className="btn btn-quiet btn-sm">
                      Empezar
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
