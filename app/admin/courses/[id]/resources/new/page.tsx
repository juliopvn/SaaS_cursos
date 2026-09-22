import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { getCourseById } from "@/lib/repositories/courses";
import { getSectionById } from "@/lib/repositories/sections";

export const metadata: Metadata = { title: "Nuevo recurso" };

export default async function NewResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sectionId?: string }>;
}) {
  const [{ id }, { sectionId }] = await Promise.all([params, searchParams]);
  const [course, section] = await Promise.all([getCourseById(id), sectionId ? getSectionById(sectionId) : null]);
  if (!course || !section || section.courseId !== course.id) notFound();

  return (
    <>
      <p className="label">{course.title}</p>
      <h1 className="heading mt-1 mb-8 text-4xl">Nuevo recurso</h1>
      <ResourceEditor courseId={course.id} sectionId={section.id} sectionTitle={section.title} />
    </>
  );
}
