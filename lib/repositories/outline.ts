import type { CourseDTO, CourseOutline } from "@/lib/types";
import { listResourceSummariesByCourse } from "./resources";
import { listSections } from "./sections";

/** Curso → secciones ordenadas → recursos ordenados (sin markdown). Tres consultas, sin N+1. */
export async function getOutline(course: CourseDTO): Promise<CourseOutline> {
  const [sections, resources] = await Promise.all([listSections(course.id), listResourceSummariesByCourse(course.id)]);
  return {
    course,
    sections: sections.map((section) => ({
      ...section,
      resources: resources.filter((r) => r.sectionId === section.id).sort((a, b) => a.order - b.order),
    })),
  };
}
