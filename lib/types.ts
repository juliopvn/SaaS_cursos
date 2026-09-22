/** DTOs planos (ids como string) que cruzan la frontera servidor → cliente. */

export type Role = "admin" | "student";

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface CourseDTO {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SectionDTO {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export interface ResourceDTO {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  order: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/** Recurso sin el markdown: para índices y listados. */
export type ResourceSummaryDTO = Omit<ResourceDTO, "content">;

export interface FeedbackDTO {
  id: string;
  resourceId: string;
  userId: string;
  text: string;
  createdAt: string;
}

/** Feedback enriquecido para la vista de admin. */
export interface FeedbackDetailDTO extends FeedbackDTO {
  resourceTitle: string;
  courseId: string;
  courseTitle: string;
  userName: string;
  userEmail: string;
}

export interface CourseOutline {
  course: CourseDTO;
  sections: Array<SectionDTO & { resources: ResourceSummaryDTO[] }>;
}
