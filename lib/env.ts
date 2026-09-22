import { z } from "zod";

/** Trata las variables vacías (`FOO=`) como no definidas. */
function dropEmpty(raw: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v.trim() !== ""));
}

const bool = (fallback: boolean) =>
  z
    .enum(["true", "false"])
    .default(fallback ? "true" : "false")
    .transform((v) => v === "true");

const PLACEHOLDER_SECRET = /change-?me/i;

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_ENV: z.string().optional(),

    APP_URL: z.url({ error: "APP_URL debe ser una URL absoluta (p. ej. http://localhost:3000)" }),

    MONGODB_URI: z
      .string({ error: "MONGODB_URI es obligatoria" })
      .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI debe empezar por mongodb:// o mongodb+srv://"),
    MONGODB_DB: z.string().min(1).default("saas-cursos"),

    AUTH_SECRET: z
      .string({ error: "AUTH_SECRET es obligatoria" })
      .min(32, "AUTH_SECRET necesita al menos 32 caracteres (openssl rand -base64 48)"),
    MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    ADMIN_EMAIL: z
      .email({ error: "ADMIN_EMAIL debe ser un email válido" })
      .transform((v) => v.toLowerCase()),
    ADMIN_NAME: z.string().min(1).default("Admin"),

    MAIL_PROVIDER: z.enum(["smtp", "resend"]).default("smtp"),
    MAIL_FROM: z.string().min(3, "MAIL_FROM es obligatoria"),
    SMTP_HOST: z.string().default("localhost"),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
    SMTP_SECURE: bool(false),
    RESEND_API_KEY: z.string().optional(),

    S3_ENDPOINT: z.url({ error: "S3_ENDPOINT debe ser una URL absoluta" }),
    S3_REGION: z.string().min(1).default("us-east-1"),
    S3_BUCKET: z.string().min(3, "S3_BUCKET es obligatoria"),
    S3_ACCESS_KEY_ID: z.string({ error: "S3_ACCESS_KEY_ID es obligatoria" }).min(1),
    S3_SECRET_ACCESS_KEY: z.string({ error: "S3_SECRET_ACCESS_KEY es obligatoria" }).min(1),
    S3_FORCE_PATH_STYLE: bool(true),
    MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(100).default(10),
  })
  .superRefine((env, ctx) => {
    const isProduction = env.APP_ENV === "production" || env.VERCEL_ENV === "production";
    if (!isProduction) return;

    const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (env.MAIL_PROVIDER !== "resend") fail("MAIL_PROVIDER", "En producción MAIL_PROVIDER debe ser resend");
    if (!env.RESEND_API_KEY) fail("RESEND_API_KEY", "En producción RESEND_API_KEY es obligatoria");
    if (!env.APP_URL.startsWith("https://")) fail("APP_URL", "En producción APP_URL debe ser https");
    if (PLACEHOLDER_SECRET.test(env.AUTH_SECRET)) fail("AUTH_SECRET", "En producción AUTH_SECRET no puede ser el valor de ejemplo");
    if (env.S3_FORCE_PATH_STYLE) fail("S3_FORCE_PATH_STYLE", "En producción (R2) S3_FORCE_PATH_STYLE debe ser false");
  });

export type Env = z.infer<typeof schema> & { isProduction: boolean; isSecureCookies: boolean };

export class EnvError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Configuración de entorno inválida:\n${issues.map((i) => `  - ${i}`).join("\n")}\nRevisa .env.example.`);
    this.name = "EnvError";
  }
}

/** Valida un objeto de variables. Pura: la usan los tests y `getEnv()`. */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = schema.safeParse(dropEmpty(raw));
  if (!result.success) {
    throw new EnvError(result.error.issues.map((i) => `${i.path.join(".") || "env"}: ${i.message}`));
  }
  const env = result.data;
  return {
    ...env,
    isProduction: env.APP_ENV === "production" || env.VERCEL_ENV === "production",
    isSecureCookies: env.APP_URL.startsWith("https://"),
  };
}

let cached: Env | undefined;

/** Lectura perezosa y memoizada: `next build` no necesita secretos, el arranque sí (ver instrumentation.ts). */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
