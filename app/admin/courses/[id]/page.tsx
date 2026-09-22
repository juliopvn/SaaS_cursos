import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseDangerZone } from "@/components/admin/course-danger-zone";
import { CourseForm } from "@/components/admin/course-form";
import { OutlineEditor } from "@/components/admin/outline-editor";
import { getCourseById } from "@/lib/repositories/courses";
import { countFeedbackByResource } from "@/lib/repositories/feedback";
import { getOutline } from "@/lib/repositories/outline";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const course = await getCourseById((await params).id);
  return { title: course?.title ?? "Curso" };
}

export default async function AdminCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  const [outline, counts] = await Promise.all([getOutline(course), countFeedbackByResource(course.id)]);
  const sections = outline.sections.map((s) => ({
    ...s,
    resources: s.resources.map((r) => ({ ...r, feedbackCount: counts.get(r.id) ?? 0 })),
  }));
  const totalResources = sections.reduce((n, s) => n + s.resources.length, 0);

  return (
    <>
      <Link href="/admin" className="text-sm font-bold">
        ← Cursos
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className={`badge ${course.published ? "badge-live" : ""}`}>{course.published ? "Publicado" : "Borrador"}</span>
            <span className="font-mono text-xs text-muted">/{course.slug}</span>
          </div>
          <h1 className="heading mt-2 text-4xl" data-testid="course-title">
            {course.title}
          </h1>
          <p className="mt-2 text-ink-soft">
            {sections.length} {sections.length === 1 ? "sección" : "secciones"} · {totalResources}{" "}
            {totalResources === 1 ? "recurso" : "recursos"}
          </p>
        </div>
        <Link href={`/admin/feedback?courseId=${course.id}`} className="btn btn-secondary">
          Ver feedback
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="estructura">
          <h2 id="estructura" className="label mb-4">
            Estructura
          </h2>
          <OutlineEditor courseId={course.id} sections={sections} />
        </section>
        <aside className="space-y-8">
          <section aria-labelledby="ajustes" className="panel p-5">
            <h2 id="ajustes" className="heading mb-4 text-xl">
              Ajustes del curso
            </h2>
            <CourseForm course={course} />
          </section>
          <section aria-labelledby="peligro" className="panel border-alert/40 p-5">
            <h2 id="peligro" className="heading mb-3 text-xl">
              Zona de peligro
            </h2>
            <CourseDangerZone courseId={course.id} title={course.title} />
          </section>
        </aside>
      </div>
    </>
  );
}
