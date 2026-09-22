import { ObjectId } from "mongodb";
import { buildReorder, nextOrder } from "@/lib/order";
import type { ResourceDTO, ResourceSummaryDTO } from "@/lib/types";
import { col, type ResourceDoc } from "./collections";
import { deleteFeedbackByResources } from "./feedback";

export function toResourceDTO(doc: ResourceDoc): ResourceDTO {
  return {
    id: doc._id.toHexString(),
    sectionId: doc.sectionId.toHexString(),
    courseId: doc.courseId.toHexString(),
    title: doc.title,
    order: doc.order,
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toResourceSummary({ content: _content, ...rest }: ResourceDTO): ResourceSummaryDTO {
  return rest;
}

const NO_CONTENT = { projection: { content: 0 } } as const;

/** Recursos de un curso, sin markdown, para construir índices. Orden por sección y luego `order`. */
export async function listResourceSummariesByCourse(courseId: string): Promise<ResourceSummaryDTO[]> {
  if (!ObjectId.isValid(courseId)) return [];
  const docs = await (await col("resources"))
    .find({ courseId: new ObjectId(courseId) }, NO_CONTENT)
    .sort({ order: 1, _id: 1 })
    .toArray();
  return docs.map((d) => toResourceSummary(toResourceDTO({ ...d, content: "" })));
}

export async function listResources(sectionId: string): Promise<ResourceDTO[]> {
  if (!ObjectId.isValid(sectionId)) return [];
  const docs = await (await col("resources"))
    .find({ sectionId: new ObjectId(sectionId) })
    .sort({ order: 1, _id: 1 })
    .toArray();
  return docs.map(toResourceDTO);
}

export async function getResourceById(id: string): Promise<ResourceDTO | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await col("resources")).findOne({ _id: new ObjectId(id) });
  return doc ? toResourceDTO(doc) : null;
}

export async function createResource(input: {
  sectionId: string;
  courseId: string;
  title: string;
  content: string;
}): Promise<ResourceDTO> {
  const resources = await col("resources");
  const sectionId = new ObjectId(input.sectionId);
  const siblings = await resources.find({ sectionId }, { projection: { order: 1 } }).toArray();
  const now = new Date();
  const doc: ResourceDoc = {
    _id: new ObjectId(),
    sectionId,
    courseId: new ObjectId(input.courseId),
    title: input.title,
    content: input.content,
    order: nextOrder(siblings.map((s) => s.order)),
    createdAt: now,
    updatedAt: now,
  };
  await resources.insertOne(doc);
  return toResourceDTO(doc);
}

export async function updateResource(
  id: string,
  patch: Partial<Pick<ResourceDTO, "title" | "content">>,
): Promise<ResourceDTO | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await col("resources")).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc ? toResourceDTO(doc) : null;
}

export async function reorderResources(sectionId: string, orderedIds: string[]): Promise<ResourceDTO[]> {
  const current = await listResources(sectionId);
  const plan = buildReorder(
    current.map((r) => r.id),
    orderedIds,
  );
  const resources = await col("resources");
  await resources.bulkWrite(
    plan.map(({ id, order }) => ({ updateOne: { filter: { _id: new ObjectId(id) }, update: { $set: { order } } } })),
  );
  return listResources(sectionId);
}

export async function deleteResource(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const resourceId = new ObjectId(id);
  await deleteFeedbackByResources([resourceId]);
  const result = await (await col("resources")).deleteOne({ _id: resourceId });
  return result.deletedCount === 1;
}

export async function deleteResourcesBySections(sectionIds: ObjectId[]): Promise<void> {
  if (sectionIds.length === 0) return;
  const resources = await col("resources");
  const docs = await resources.find({ sectionId: { $in: sectionIds } }, { projection: { _id: 1 } }).toArray();
  await deleteFeedbackByResources(docs.map((d) => d._id));
  await resources.deleteMany({ sectionId: { $in: sectionIds } });
}

/** Upsert por (sectionId, title) para el seed; fija el orden explícito. */
export async function upsertResource(input: {
  sectionId: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
}): Promise<ResourceDTO> {
  const now = new Date();
  const sectionId = new ObjectId(input.sectionId);
  const doc = await (await col("resources")).findOneAndUpdate(
    { sectionId, title: input.title },
    {
      $set: { content: input.content, order: input.order, courseId: new ObjectId(input.courseId), updatedAt: now },
      $setOnInsert: { sectionId, title: input.title, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error("No se pudo guardar el recurso");
  return toResourceDTO(doc);
}
