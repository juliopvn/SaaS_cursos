import type { NextRequest } from "next/server";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { ApiError, json, notFound, readJson, route } from "@/lib/http";
import { getCourseById } from "@/lib/repositories/courses";
import { createFeedback, listFeedbackDetailed, listOwnFeedback } from "@/lib/repositories/feedback";
import { getResourceById } from "@/lib/repositories/resources";
import { feedbackCreateInput, feedbackQueryInput, objectId } from "@/lib/validators";

export const runtime = "nodejs";

/**
 * Admin: lista todo el feedback (filtrable por curso o recurso).
 * Student: solo sus propios comentarios y siempre de un recurso concreto.
 */
export const GET = route(async (request: NextRequest) => {
  const session = await requireUser();
  const query = feedbackQueryInput.parse({
    courseId: request.nextUrl.searchParams.get("courseId") ?? undefined,
    resourceId: request.nextUrl.searchParams.get("resourceId") ?? undefined,
  });

  if (session.role === "admin") return json({ feedback: await listFeedbackDetailed(query) });

  if (!query.resourceId) throw new ApiError(403, "forbidden", "No tienes permiso para listar el feedback de otros alumnos");
  return json({ feedback: await listOwnFeedback(objectId.parse(query.resourceId), session.userId) });
});

export const POST = route(async (request: NextRequest) => {
  const session = await requireRole("student");
  const input = feedbackCreateInput.parse(await readJson(request));
  const resource = await getResourceById(input.resourceId);
  if (!resource || !(await getCourseById(resource.courseId, { onlyPublished: true }))) notFound("Recurso");
  const feedback = await createFeedback({ ...input, userId: session.userId });
  return json({ feedback }, { status: 201 });
});
