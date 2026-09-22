import { z } from "zod";
import { slugify } from "@/lib/slug";

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Identificador no válido");

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "El email es demasiado largo")
  .pipe(z.email("Introduce un email válido"));

export const slug = z
  .string()
  .trim()
  .min(3, "El slug necesita al menos 3 caracteres")
  .max(80, "El slug admite como máximo 80 caracteres")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usa solo minúsculas, números y guiones");

/** Solo rutas internas relativas: evita open-redirects vía `next`. */
export function isSafeNext(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 512 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f]/.test(value)
  );
}

export const authRequestInput = z.object({
  email,
  next: z.string().optional().transform((v) => (isSafeNext(v) ? v : undefined)),
});

export const authVerifyInput = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Enlace no válido"),
});

export const courseCreateInput = z
  .object({
    title: z.string().trim().min(3, "El título necesita al menos 3 caracteres").max(120),
    description: z.string().trim().max(1000).default(""),
    slug: slug.optional(),
    published: z.boolean().default(false),
  })
  .transform((v) => ({ ...v, slug: v.slug ?? slugify(v.title) }))
  .pipe(z.object({ title: z.string(), description: z.string(), slug, published: z.boolean() }));

export const courseUpdateInput = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(1000),
    slug,
    published: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No hay cambios que guardar");

export const sectionCreateInput = z.object({
  courseId: objectId,
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
});

export const sectionUpdateInput = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
});

export const resourceCreateInput = z.object({
  sectionId: objectId,
  title: z.string().trim().min(1, "El título es obligatorio").max(160),
  content: z.string().max(100_000, "El contenido supera los 100 000 caracteres").default(""),
});

export const resourceUpdateInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    content: z.string().max(100_000),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No hay cambios que guardar");

export const reorderInput = z.object({
  /** Curso (para secciones) o sección (para recursos) cuyos hijos se reordenan. */
  parentId: objectId,
  ids: z.array(objectId).min(1).max(500),
});

export const feedbackCreateInput = z.object({
  resourceId: objectId,
  text: z.string().trim().min(1, "Escribe tu comentario").max(2000, "Máximo 2000 caracteres"),
});

export const feedbackQueryInput = z.object({
  courseId: objectId.optional(),
  resourceId: objectId.optional(),
});

export const ALLOWED_UPLOAD_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;

export const uploadInput = z.object({
  filename: z.string().trim().min(1).max(200),
  contentType: z.enum(ALLOWED_UPLOAD_TYPES, { error: "Tipo de fichero no permitido (PDF, PNG, JPEG o WebP)" }),
  size: z.number().int().positive(),
});
