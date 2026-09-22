import { ObjectId } from "mongodb";
import { buildReorder, nextOrder } from "@/lib/order";
import type { SectionDTO } from "@/lib/types";
import { col, type SectionDoc } from "./collections";
import { deleteResourcesBySections } from "./resources";

export function toSectionDTO(doc: SectionDoc): SectionDTO {
  return { id: doc._id.toHexString(), courseId: doc.courseId.toHexString(), title: doc.title, order: doc.order };
}

export async function listSections(courseId: string): Promise<SectionDTO[]> {
  if (!ObjectId.isValid(courseId)) return [];
  const docs = await (await col("sections"))
    .find({ courseId: new ObjectId(courseId) })
    .sort({ order: 1, _id: 1 })
    .toArray();
  return docs.map(toSectionDTO);
}

export async function getSectionById(id: string): Promise<SectionDTO | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await col("sections")).findOne({ _id: new ObjectId(id) });
  return doc ? toSectionDTO(doc) : null;
}

export async function createSection(input: { courseId: string; title: string }): Promise<SectionDTO> {
  const sections = await col("sections");
  const courseId = new ObjectId(input.courseId);
  const existing = await sections.find({ courseId }, { projection: { order: 1 } }).toArray();
  const doc: SectionDoc = {
    _id: new ObjectId(),
    courseId,
    title: input.title,
    order: nextOrder(existing.map((s) => s.order)),
  };
  await sections.insertOne(doc);
  return toSectionDTO(doc);
}

export async function updateSection(id: string, patch: { title: string }): Promise<SectionDTO | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await col("sections")).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: patch },
    { returnDocument: "after" },
  );
  return doc ? toSectionDTO(doc) : null;
}

export async function reorderSections(courseId: string, orderedIds: string[]): Promise<SectionDTO[]> {
  const current = await listSections(courseId);
  const plan = buildReorder(
    current.map((s) => s.id),
    orderedIds,
  );
  const sections = await col("sections");
  await sections.bulkWrite(
    plan.map(({ id, order }) => ({ updateOne: { filter: { _id: new ObjectId(id) }, update: { $set: { order } } } })),
  );
  return listSections(courseId);
}

export async function deleteSection(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const sectionId = new ObjectId(id);
  await deleteResourcesBySections([sectionId]);
  const result = await (await col("sections")).deleteOne({ _id: sectionId });
  return result.deletedCount === 1;
}

export async function deleteSectionsByCourse(courseId: ObjectId): Promise<void> {
  const sections = await col("sections");
  const docs = await sections.find({ courseId }, { projection: { _id: 1 } }).toArray();
  await deleteResourcesBySections(docs.map((d) => d._id));
  await sections.deleteMany({ courseId });
}

/** Upsert por (courseId, title) para el seed; fija el orden explícito. */
export async function upsertSection(input: { courseId: string; title: string; order: number }): Promise<SectionDTO> {
  const doc = await (await col("sections")).findOneAndUpdate(
    { courseId: new ObjectId(input.courseId), title: input.title },
    { $set: { order: input.order }, $setOnInsert: { courseId: new ObjectId(input.courseId), title: input.title } },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error("No se pudo guardar la sección");
  return toSectionDTO(doc);
}
