import type { NextRequest } from "next/server";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { json, notFound, readJson, route, type RouteParams } from "@/lib/http";
import { deleteCourse, getCourseById, updateCourse } from "@/lib/repositories/courses";
import { getOutline } from "@/lib/repositories/outline";
import { courseUpdateInput } from "@/lib/validators";

export const runtime = "nodejs";

/** Un curso no publicado es 404 para el alumno, también por API. */
export const GET = route(async (_request: NextRequest, { params }: RouteParams<"id">) => {
  const session = await requireUser();
  const { id } = await params;
  const course = await getCourseById(id, { onlyPublished: session.role !== "admin" });
  if (!course) notFound("Curso");
  return json(await getOutline(course));
});

export const PATCH = route(async (request: NextRequest, { params }: RouteParams<"id">) => {
  await requireRole("admin");
  const { id } = await params;
  const patch = courseUpdateInput.parse(await readJson(request));
  const course = await updateCourse(id, patch);
  if (!course) notFound("Curso");
  return json({ course });
});

export const DELETE = route(async (_request: NextRequest, { params }: RouteParams<"id">) => {
  await requireRole("admin");
  const { id } = await params;
  if (!(await deleteCourse(id))) notFound("Curso");
  return json({ ok: true });
});
