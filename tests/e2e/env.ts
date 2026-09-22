import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Carga .env.local si existe (local). En CI las variables llegan del entorno.
const envFile = resolve(process.cwd(), ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
export const E2E_DB = process.env.E2E_MONGODB_DB ?? "saas-cursos-e2e";
export const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
export const MAILHOG_API_URL = process.env.MAILHOG_API_URL ?? "http://localhost:8025";
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();

/** Solo se levanta servidor y se siembra la BD cuando el objetivo es local; nunca contra producción. */
export const IS_LOCAL_TARGET = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE_URL);

export const AUTH_DIR = resolve(process.cwd(), "tests/e2e/.auth");
export const STATE = {
  admin: resolve(AUTH_DIR, "admin.json"),
  student: resolve(AUTH_DIR, "student1.json"),
  student2: resolve(AUTH_DIR, "student2.json"),
} as const;
export const STUDENT1 = { email: "student1@example.com", name: "Lucía Fernández" };
export const STUDENT2 = { email: "student2@example.com", name: "Marcos Ortega" };
