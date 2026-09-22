import type { NextRequest } from "next/server";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { json, readJson, route } from "@/lib/http";
import { createCourse, listCourses } from "@/lib/repositories/courses";
import { courseCreateInput } from "@/lib/validators";

export const runtime = "nodejs";

/** Admin ve todos los cursos; el alumno, solo los publicados. */
export const GET = route(async () => {
  const session = await requireUser();
  return json({ courses: await listCourses({ onlyPublished: session.role !== "admin" }) });
});

export const POST = route(async (request: NextRequest) => {
  await requireRole("admin");
  const input = courseCreateInput.parse(await readJson(request));
  return json({ course: await createCourse(input) }, { status: 201 });
});
