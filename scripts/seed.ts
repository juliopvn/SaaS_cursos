/**
 * Seed idempotente (upserts por clave natural).
 *   npm run seed                 → crea/actualiza datos de ejemplo
 *   npm run seed:reset           → borra todo y recrea (SOLO local, ver lib/seed-guard.ts)
 *   npm run seed -- --only-admin → solo el usuario admin (ADMIN_EMAIL)
 */
import { closeDb, getDb } from "../lib/db";
import { getEnv } from "../lib/env";
import { upsertCourseBySlug } from "../lib/repositories/courses";
import { upsertFeedback } from "../lib/repositories/feedback";
import { upsertResource } from "../lib/repositories/resources";
import { upsertSection } from "../lib/repositories/sections";
import { upsertUser } from "../lib/repositories/users";
import { assertSafeToReset } from "../lib/seed-guard";
import { SEED_COURSES, SEED_FEEDBACK, SEED_STUDENTS } from "./seed-data";

const COLLECTIONS = ["users", "courses", "sections", "resources", "feedback", "magic_tokens", "rate_limits"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

async function main() {
  const args = new Set(process.argv.slice(2));
  const env = getEnv();

  if (args.has("--reset")) {
    if (env.isProduction) throw new Error("seed --reset rechazado: entorno de producción.");
    assertSafeToReset(env.MONGODB_URI);
    const db = await getDb();
    await Promise.all(COLLECTIONS.map((name) => db.collection(name).deleteMany({})));
    console.log(`[seed] reset: colecciones vaciadas en "${env.MONGODB_DB}"`);
  }

  await getDb(); // asegura índices
  const admin = await upsertUser({ email: env.ADMIN_EMAIL, name: env.ADMIN_NAME, role: "admin" });
  console.log(`[seed] admin: ${admin.email}`);
  if (args.has("--only-admin")) return;

  const students = new Map<string, string>();
  for (const s of SEED_STUDENTS) {
    const user = await upsertUser({ ...s, role: "student" });
    students.set(s.email, user.id);
  }

  const resourceIds = new Map<string, string>(); // `${slug}::${title}` → id
  for (const course of SEED_COURSES) {
    const saved = await upsertCourseBySlug({
      slug: course.slug,
      title: course.title,
      description: course.description,
      published: course.published,
    });
    for (const [si, section] of course.sections.entries()) {
      const savedSection = await upsertSection({ courseId: saved.id, title: section.title, order: si + 1 });
      for (const [ri, resource] of section.resources.entries()) {
        const savedResource = await upsertResource({
          sectionId: savedSection.id,
          courseId: saved.id,
          title: resource.title,
          content: resource.content,
          order: ri + 1,
        });
        resourceIds.set(`${course.slug}::${resource.title}`, savedResource.id);
      }
    }
  }

  for (const [email, slug, title, text, daysAgo] of SEED_FEEDBACK) {
    const userId = students.get(email);
    const resourceId = resourceIds.get(`${slug}::${title}`);
    if (!userId || !resourceId) throw new Error(`Seed inconsistente: ${email} / ${slug} / ${title}`);
    await upsertFeedback({ resourceId, userId, text, createdAt: new Date(Date.now() - daysAgo * DAY_MS) });
  }

  const db = await getDb();
  const counts = Object.fromEntries(
    await Promise.all(
      (["users", "courses", "sections", "resources", "feedback"] as const).map(
        async (n) => [n, await db.collection(n).countDocuments()] as const,
      ),
    ),
  );
  console.log("[seed] listo:", JSON.stringify(counts));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
