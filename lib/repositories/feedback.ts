import { ObjectId } from "mongodb";
import type { FeedbackDTO, FeedbackDetailDTO } from "@/lib/types";
import { col, type FeedbackDoc } from "./collections";

function toFeedbackDTO(doc: FeedbackDoc): FeedbackDTO {
  return {
    id: doc._id.toHexString(),
    resourceId: doc.resourceId.toHexString(),
    userId: doc.userId.toHexString(),
    text: doc.text,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createFeedback(input: { resourceId: string; userId: string; text: string }): Promise<FeedbackDTO> {
  const doc: FeedbackDoc = {
    _id: new ObjectId(),
    resourceId: new ObjectId(input.resourceId),
    userId: new ObjectId(input.userId),
    text: input.text,
    createdAt: new Date(),
  };
  await (await col("feedback")).insertOne(doc);
  return toFeedbackDTO(doc);
}

/** Comentarios de un alumno en un recurso (más recientes primero). */
export async function listOwnFeedback(resourceId: string, userId: string): Promise<FeedbackDTO[]> {
  if (!ObjectId.isValid(resourceId) || !ObjectId.isValid(userId)) return [];
  const docs = await (await col("feedback"))
    .find({ resourceId: new ObjectId(resourceId), userId: new ObjectId(userId) })
    .sort({ createdAt: -1, _id: -1 })
    .toArray();
  return docs.map(toFeedbackDTO);
}

/**
 * Vista de admin: feedback con recurso, curso y alumno, filtrable por curso o recurso.
 * Orden por fecha descendente.
 */
export async function listFeedbackDetailed(filter: {
  courseId?: string;
  resourceId?: string;
}): Promise<FeedbackDetailDTO[]> {
  const feedback = await col("feedback");
  const query: Record<string, unknown> = {};

  if (filter.resourceId) {
    if (!ObjectId.isValid(filter.resourceId)) return [];
    query.resourceId = new ObjectId(filter.resourceId);
  } else if (filter.courseId) {
    if (!ObjectId.isValid(filter.courseId)) return [];
    const ids = await (await col("resources"))
      .find({ courseId: new ObjectId(filter.courseId) }, { projection: { _id: 1 } })
      .toArray();
    query.resourceId = { $in: ids.map((d) => d._id) };
  }

  const docs = await feedback.find(query).sort({ createdAt: -1, _id: -1 }).limit(500).toArray();
  if (docs.length === 0) return [];

  const [resourceDocs, userDocs] = await Promise.all([
    (await col("resources"))
      .find({ _id: { $in: [...new Set(docs.map((d) => d.resourceId.toHexString()))].map((i) => new ObjectId(i)) } }, {
        projection: { title: 1, courseId: 1 },
      })
      .toArray(),
    (await col("users"))
      .find({ _id: { $in: [...new Set(docs.map((d) => d.userId.toHexString()))].map((i) => new ObjectId(i)) } })
      .toArray(),
  ]);
  const courseDocs = await (await col("courses"))
    .find({ _id: { $in: [...new Set(resourceDocs.map((r) => r.courseId.toHexString()))].map((i) => new ObjectId(i)) } }, {
      projection: { title: 1 },
    })
    .toArray();

  const resources = new Map(resourceDocs.map((r) => [r._id.toHexString(), r]));
  const users = new Map(userDocs.map((u) => [u._id.toHexString(), u]));
  const courses = new Map(courseDocs.map((c) => [c._id.toHexString(), c]));

  return docs.map((d) => {
    const resource = resources.get(d.resourceId.toHexString());
    const user = users.get(d.userId.toHexString());
    const course = resource ? courses.get(resource.courseId.toHexString()) : undefined;
    return {
      ...toFeedbackDTO(d),
      resourceTitle: resource?.title ?? "Recurso eliminado",
      courseId: resource?.courseId.toHexString() ?? "",
      courseTitle: course?.title ?? "Curso eliminado",
      userName: user?.name ?? "Usuario eliminado",
      userEmail: user?.email ?? "",
    };
  });
}

export async function countFeedbackByResource(courseId: string): Promise<Map<string, number>> {
  if (!ObjectId.isValid(courseId)) return new Map();
  const resourceIds = (
    await (await col("resources")).find({ courseId: new ObjectId(courseId) }, { projection: { _id: 1 } }).toArray()
  ).map((d) => d._id);
  if (resourceIds.length === 0) return new Map();
  const rows = await (await col("feedback"))
    .aggregate<{ _id: ObjectId; n: number }>([
      { $match: { resourceId: { $in: resourceIds } } },
      { $group: { _id: "$resourceId", n: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(rows.map((r) => [r._id.toHexString(), r.n]));
}

export async function deleteFeedbackByResources(resourceIds: ObjectId[]): Promise<void> {
  if (resourceIds.length === 0) return;
  await (await col("feedback")).deleteMany({ resourceId: { $in: resourceIds } });
}

/** Upsert por (resourceId, userId, text) para el seed. */
export async function upsertFeedback(input: {
  resourceId: string;
  userId: string;
  text: string;
  createdAt: Date;
}): Promise<void> {
  const resourceId = new ObjectId(input.resourceId);
  const userId = new ObjectId(input.userId);
  await (await col("feedback")).updateOne(
    { resourceId, userId, text: input.text },
    { $setOnInsert: { resourceId, userId, text: input.text, createdAt: input.createdAt } },
    { upsert: true },
  );
}
