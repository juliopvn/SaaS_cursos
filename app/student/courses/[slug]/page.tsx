import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseIndex } from "@/components/course-index";
import { flattenReadingOrder } from "@/lib/order";
import { getCourseBySlug } from "@/lib/repositories/courses";
import { getOutline } from "@/lib/repositories/outline";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const course = await getCourseBySlug((await params).slug, { onlyPublished: true });
  return { title: course?.title ?? "Curso" };
}

export default async function StudentCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Un curso no publicado es 404 también por URL directa.
  const course = await getCourseBySlug(slug, { onlyPublished: true });
  if (!course) notFound();

  const outline = await getOutline(course);
  const first = flattenReadingOrder(outline.sections)[0];

  return (
    <>
      <Link href="/student" className="text-sm font-bold">
        ← Cursos
      </Link>
      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_26rem]">
        <header>
          <p className="label">Curso</p>
          <h1 className="display mt-2 text-[clamp(2.25rem,5vw,3.75rem)]" data-testid="course-title">
            {course.title}
          </h1>
          <p className="mt-5 max-w-prose text-lg text-ink-soft">{course.description}</p>
          {first ? (
            <Link href={`/student/courses/${course.slug}/${first.id}`} className="btn btn-primary mt-8">
              Empezar por «{first.title}»
            </Link>
          ) : (
            <p className="notice mt-8">Este curso aún no tiene recursos.</p>
          )}
        </header>
        <section aria-labelledby="indice" className="panel p-6">
          <h2 id="indice" className="label mb-5">
            Recorrido
          </h2>
          {outline.sections.length === 0 ? <p className="text-ink-soft">Sin contenido todavía.</p> : <CourseIndex outline={outline} />}
        </section>
      </div>
    </>
  );
}
