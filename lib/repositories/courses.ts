import { ObjectId } from "mongodb";
import type { CourseDTO } from "@/lib/types";
import { col, type CourseDoc } from "./collections";
import { deleteSectionsByCourse } from "./sections";

export class DuplicateSlugError extends Error {
  constructor() {
    super("Ya existe un curso con ese slug");
    this.name = "DuplicateSlugError";
  }
}

export function toCourseDTO(doc: CourseDoc): CourseDTO {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    description: doc.description,
    slug: doc.slug,
    published: doc.published,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export async function listCourses(opts: { onlyPublished?: boolean } = {}): Promise<CourseDTO[]> {
  const docs = await (await col("courses"))
    .find(opts.onlyPublished ? { published: true } : {})
    .sort({ createdAt: -1, _id: -1 })
    .toArray();
  return docs.map(toCourseDTO);
}

export async function getCourseById(id: string, opts: { onlyPublished?: boolean } = {}): Promise<CourseDTO | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await col("courses")).findOne({
    _id: new ObjectId(id),
    ...(opts.onlyPublished ? { published: true } : {}),
  });
  return doc ? toCourseDTO(doc) : null;
}

export async function getCourseBySlug(slug: string, opts: { onlyPublished?: boolean } = {}): Promise<CourseDTO | null> {
  const doc = await (await col("courses")).findOne({ slug, ...(opts.onlyPublished ? { published: true } : {}) });
  return doc ? toCourseDTO(doc) : null;
}

export async function createCourse(input: {
  title: string;
  description: string;
  slug: string;
  published: boolean;
}): Promise<CourseDTO> {
  const now = new Date();
  const doc: CourseDoc = { _id: new ObjectId(), ...input, createdAt: now, updatedAt: now };
  try {
    await (await col("courses")).insertOne(doc);
  } catch (error) {
    if (isDuplicateKey(error)) throw new DuplicateSlugError();
    throw error;
  }
  return toCourseDTO(doc);
}

export async function updateCourse(
  id: string,
  patch: Partial<Pick<CourseDTO, "title" | "description" | "slug" | "published">>,
): Promise<CourseDTO | null> {
  if (!ObjectId.isValid(id)) return null;
  try {
    const doc = await (await col("courses")).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...patch, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    return doc ? toCourseDTO(doc) : null;
  } catch (error) {
    if (isDuplicateKey(error)) throw new DuplicateSlugError();
    throw error;
  }
}

/** Borrado en cascada: feedback → recursos → secciones → curso. */
export async function deleteCourse(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const courseId = new ObjectId(id);
  await deleteSectionsByCourse(courseId);
  const result = await (await col("courses")).deleteOne({ _id: courseId });
  return result.deletedCount === 1;
}

/** Upsert por slug (clave natural) para el seed. */
export async function upsertCourseBySlug(input: {
  title: string;
  description: string;
  slug: string;
  published: boolean;
}): Promise<CourseDTO> {
  const now = new Date();
  const doc = await (await col("courses")).findOneAndUpdate(
    { slug: input.slug },
    {
      $set: { title: input.title, description: input.description, published: input.published, updatedAt: now },
      $setOnInsert: { slug: input.slug, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error("No se pudo guardar el curso");
  return toCourseDTO(doc);
}
