import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseIndex } from "@/components/course-index";
import { FeedbackForm } from "@/components/feedback-form";
import { Markdown } from "@/components/markdown";
import { getSession } from "@/lib/auth/session";
import { flattenReadingOrder } from "@/lib/order";
import { getCourseBySlug } from "@/lib/repositories/courses";
import { listOwnFeedback } from "@/lib/repositories/feedback";
import { getOutline } from "@/lib/repositories/outline";
import { getResourceById } from "@/lib/repositories/resources";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string; resourceId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resource = await getResourceById((await params).resourceId);
  return { title: resource?.title ?? "Recurso" };
}

export default async function StudentResourcePage({ params }: { params: Params }) {
  const { slug, resourceId } = await params;
  const course = await getCourseBySlug(slug, { onlyPublished: true });
  if (!course) notFound();
  const resource = await getResourceById(resourceId);
  if (!resource || resource.courseId !== course.id) notFound();

  const [session, outline] = await Promise.all([getSession(), getOutline(course)]);
  const ordered = flattenReadingOrder(outline.sections);
  const position = ordered.findIndex((r) => r.id === resource.id);
  const previous = position > 0 ? ordered[position - 1] : undefined;
  const next = position >= 0 ? ordered[position + 1] : undefined;
  const section = outline.sections.find((s) => s.id === resource.sectionId);
  const sectionIndex = outline.sections.findIndex((s) => s.id === resource.sectionId);
  const own = session?.role === "student" ? await listOwnFeedback(resource.id, session.userId) : [];

  return (
    <>
      <Link href={`/student/courses/${course.slug}`} className="text-sm font-bold">
        ← {course.title}
      </Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-[19rem_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <details className="panel p-4 lg:hidden">
            <summary className="cursor-pointer font-bold">Índice del curso</summary>
            <div className="mt-4">
              <CourseIndex outline={outline} currentResourceId={resource.id} compact />
            </div>
          </details>
          <div className="panel hidden p-5 lg:block">
            <p className="label mb-4">Recorrido</p>
            <CourseIndex outline={outline} currentResourceId={resource.id} compact />
          </div>
        </aside>

        <article className="min-w-0">
          <header className="mb-8">
            <p className="label">
              Tramo {sectionIndex + 1} · {section?.title} · Parada {sectionIndex + 1}.{(section?.resources.findIndex((r) => r.id === resource.id) ?? 0) + 1}
            </p>
            <h1 className="heading mt-2 text-4xl" data-testid="resource-title">
              {resource.title}
            </h1>
          </header>

          <div data-testid="resource-content">
            <Markdown>{resource.content}</Markdown>
          </div>

          <nav aria-label="Navegación entre recursos" className="mt-12 grid gap-3 border-t border-rule pt-6 sm:grid-cols-2">
            {previous ? (
              <Link
                href={`/student/courses/${course.slug}/${previous.id}`}
                rel="prev"
                className="panel block p-4 no-underline hover:border-ink"
                data-testid="prev-link"
              >
                <span className="label">← Anterior</span>
                <span className="mt-1 block font-bold text-ink">{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/student/courses/${course.slug}/${next.id}`}
                rel="next"
                className="panel block p-4 text-right no-underline hover:border-ink"
                data-testid="next-link"
              >
                <span className="label">Siguiente →</span>
                <span className="mt-1 block font-bold text-ink">{next.title}</span>
              </Link>
            ) : (
              <Link href={`/student/courses/${course.slug}`} className="panel block p-4 text-right no-underline hover:border-ink">
                <span className="label">Fin del curso</span>
                <span className="mt-1 block font-bold text-ink">Volver al índice</span>
              </Link>
            )}
          </nav>

          <div className="mt-10">
            {session?.role === "student" ? (
              <FeedbackForm resourceId={resource.id} initial={own} />
            ) : (
              <p className="notice">Estás viendo el curso como administrador. El feedback de los alumnos aparece en la sección Feedback.</p>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
