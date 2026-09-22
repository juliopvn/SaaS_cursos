import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { json, notFound, route } from "@/lib/http";
import { getCourseById } from "@/lib/repositories/courses";
import { createSection, listSections } from "@/lib/repositories/sections";
import { objectId, sectionCreateInput } from "@/lib/validators";
import { readJson } from "@/lib/http";

export const runtime = "nodejs";

export const GET = route(async (request: NextRequest) => {
  await requireRole("admin");
  const courseId = objectId.parse(request.nextUrl.searchParams.get("courseId"));
  return json({ sections: await listSections(courseId) });
});

export const POST = route(async (request: NextRequest) => {
  await requireRole("admin");
  const input = sectionCreateInput.parse(await readJson(request));
  if (!(await getCourseById(input.courseId))) notFound("Curso");
  return json({ section: await createSection(input) }, { status: 201 });
});
