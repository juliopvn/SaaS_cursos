import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { getCourseById } from "@/lib/repositories/courses";
import { getResourceById } from "@/lib/repositories/resources";
import { getSectionById } from "@/lib/repositories/sections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar recurso" };

export default async function EditResourcePage({ params }: { params: Promise<{ id: string; resourceId: string }> }) {
  const { id, resourceId } = await params;
  const resource = await getResourceById(resourceId);
  if (!resource || resource.courseId !== id) notFound();
  const [course, section] = await Promise.all([getCourseById(id), getSectionById(resource.sectionId)]);
  if (!course || !section) notFound();

  return (
    <>
      <p className="label">{course.title}</p>
      <h1 className="heading mt-1 mb-8 text-4xl">Editar recurso</h1>
      <ResourceEditor courseId={course.id} sectionId={section.id} sectionTitle={section.title} resource={resource} />
    </>
  );
}
