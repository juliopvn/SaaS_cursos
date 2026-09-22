import { redirect } from "next/navigation";
import { ApiError } from "@/lib/http";
import type { Role } from "@/lib/types";
import { getSession, type Session } from "./session";

/** Guards para Route Handlers: lanzan `ApiError` (401/403) que `route()` convierte en JSON. */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "unauthorized", "Inicia sesión para continuar");
  return session;
}

export async function requireRole(role: Role): Promise<Session> {
  const session = await requireUser();
  if (session.role !== role) throw new ApiError(403, "forbidden", "No tienes permiso para esta acción");
  return session;
}

/** Guards para páginas: redirigen en lugar de lanzar. */
export async function requirePageRole(role: Role, path: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (session.role !== role) redirect(session.role === "admin" ? "/admin" : "/student");
  return session;
}

/** Páginas del área de alumno: el admin también puede verlas (`admin puede ver ambas áreas`). */
export async function requirePageUser(path: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(path)}`);
  return session;
}
