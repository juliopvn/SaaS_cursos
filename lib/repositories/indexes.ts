import type { Db } from "mongodb";

/** Idempotente: `createIndex` con la misma definición no falla ni duplica. */
export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("courses").createIndex({ slug: 1 }, { unique: true }),
    db.collection("sections").createIndex({ courseId: 1, order: 1 }),
    db.collection("resources").createIndex({ sectionId: 1, order: 1 }),
    db.collection("resources").createIndex({ courseId: 1 }),
    db.collection("feedback").createIndex({ resourceId: 1, createdAt: -1 }),
    db.collection("feedback").createIndex({ userId: 1 }),
    db.collection("magic_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("magic_tokens").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
