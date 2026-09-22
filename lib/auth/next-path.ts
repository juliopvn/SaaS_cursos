import { isSafeNext } from "@/lib/validators";
import type { Role } from "@/lib/types";

export function defaultHome(role: Role): string {
  return role === "admin" ? "/admin" : "/student";
}

/** Destino tras el login: `next` validado (interno y permitido para el rol) o la home del rol. */
export function resolveNext(next: string | undefined, role: Role): string {
  if (!isSafeNext(next)) return defaultHome(role);
  const isAdminPath = next === "/admin" || next.startsWith("/admin/");
  if (isAdminPath && role !== "admin") return defaultHome(role);
  return next;
}
