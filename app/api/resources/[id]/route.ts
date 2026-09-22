import type { NextRequest } from "next/server";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { json, notFound, readJson, route, type RouteParams } from "@/lib/http";
import { getCourseById } from "@/lib/repositories/courses";
import { deleteResource, getResourceById, updateResource } from "@/lib/repositories/resources";
import { resourceUpdateInput } from "@/lib/validators";

export const runtime = "nodejs";

export const GET = route(async (_request: NextRequest, { params }: RouteParams<"id">) => {
  const session = await requireUser();
  const { id } = await params;
  const resource = await getResourceById(id);
  if (!resource) notFound("Recurso");
  // El alumno solo accede a recursos de cursos publicados.
  if (session.role !== "admin" && !(await getCourseById(resource.courseId, { onlyPublished: true }))) notFound("Recurso");
  return json({ resource });
});

export const PATCH = route(async (request: NextRequest, { params }: RouteParams<"id">) => {
  await requireRole("admin");
  const { id } = await params;
  const resource = await updateResource(id, resourceUpdateInput.parse(await readJson(request)));
  if (!resource) notFound("Recurso");
  return json({ resource });
});

export const DELETE = route(async (_request: NextRequest, { params }: RouteParams<"id">) => {
  await requireRole("admin");
  const { id } = await params;
  if (!(await deleteResource(id))) notFound("Recurso");
  return json({ ok: true });
});
