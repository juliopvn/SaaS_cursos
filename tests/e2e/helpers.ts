import { randomBytes } from "node:crypto";
import { expect, type APIRequestContext, type Page, type PlaywrightWorkerArgs } from "@playwright/test";
import { MongoClient } from "mongodb";
import { BASE_URL, E2E_DB, MAILHOG_API_URL, MONGODB_URI, STATE } from "./env";

export const uid = () => randomBytes(4).toString("hex");
export const uniqueEmail = () => `e2e-${uid()}@example.com`;

/** Los endpoints mutantes exigen `Origin`; los navegadores lo envían solos, el cliente API no. */
export const ORIGIN = { Origin: new URL(BASE_URL).origin };

// --- MailHog ---------------------------------------------------------------

interface MailhogItem {
  ID: string;
  Content: { Body: string };
}

async function messagesFor(email: string): Promise<MailhogItem[]> {
  const response = await fetch(`${MAILHOG_API_URL}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`);
  return ((await response.json()) as { items: MailhogItem[] }).items;
}

const decodeQuotedPrintable = (body: string) =>
  body.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)));

/** Espera el email más reciente para `email` (distinto de `previousId`) y extrae el enlace del magic link. */
export async function getMagicLink(email: string, previousId?: string): Promise<{ url: string; id: string }> {
  let link: { url: string; id: string } | undefined;
  await expect
    .poll(
      async () => {
        const [latest] = await messagesFor(email);
        if (!latest || latest.ID === previousId) return false;
        const match = decodeQuotedPrintable(latest.Content.Body).match(/https?:\/\/[^\s"'<>]+\/auth\/verify\?token=[A-Za-z0-9_-]+/);
        if (!match) return false;
        link = { url: match[0], id: latest.ID };
        return true;
      },
      { message: `No llegó el magic link de ${email} a MailHog`, timeout: 15_000 },
    )
    .toBe(true);
  return link!;
}

export async function latestMessageId(email: string): Promise<string | undefined> {
  return (await messagesFor(email))[0]?.ID;
}

/** Pide el enlace desde la UI y lo devuelve (sin abrirlo). */
export async function requestMagicLink(page: Page, email: string): Promise<string> {
  const before = await latestMessageId(email);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Enviarme el enlace" }).click();
  await expect(page.getByText("Revisa tu correo")).toBeVisible();
  return (await getMagicLink(email, before)).url;
}

/** Flujo completo por UI: solicitar → abrir email → Continuar. */
export async function loginViaUI(page: Page, email: string): Promise<void> {
  const url = await requestMagicLink(page, email);
  await page.goto(url);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL(/\/(admin|student)/);
}

// --- Acceso directo a la BD de E2E (solo para preparar/verificar estado) -----

export async function withDb<T>(fn: (db: ReturnType<MongoClient["db"]>) => Promise<T>): Promise<T> {
  const client = await new MongoClient(MONGODB_URI).connect();
  try {
    return await fn(client.db(E2E_DB));
  } finally {
    await client.close();
  }
}

// --- API como admin / alumno ---------------------------------------------------

export async function apiAs(playwright: PlaywrightWorkerArgs["playwright"], role: keyof typeof STATE): Promise<APIRequestContext> {
  return playwright.request.newContext({ baseURL: BASE_URL, storageState: STATE[role], extraHTTPHeaders: ORIGIN });
}

export interface Fixture {
  courseId: string;
  slug: string;
  title: string;
  sections: Array<{ id: string; title: string; resources: Array<{ id: string; title: string }> }>;
}

/** Crea un curso con secciones y recursos vía API de admin. Cada test usa datos únicos. */
export async function createCourseFixture(
  admin: APIRequestContext,
  opts: { published?: boolean; sections?: Array<{ title: string; resources?: Array<{ title: string; content?: string }> }> } = {},
): Promise<Fixture> {
  const title = `Curso E2E ${uid()}`;
  const created = await admin.post("/api/courses", { data: { title, published: opts.published ?? true, description: "Curso de prueba" } });
  expect(created.status()).toBe(201);
  const course = (await created.json()).course as { id: string; slug: string };

  const sections: Fixture["sections"] = [];
  for (const s of opts.sections ?? [{ title: "Sección A", resources: [{ title: "Recurso A1", content: "Contenido A1" }] }]) {
    const sectionRes = await admin.post("/api/sections", { data: { courseId: course.id, title: s.title } });
    expect(sectionRes.status()).toBe(201);
    const section = (await sectionRes.json()).section as { id: string };
    const resources: Fixture["sections"][number]["resources"] = [];
    for (const r of s.resources ?? []) {
      const res = await admin.post("/api/resources", { data: { sectionId: section.id, title: r.title, content: r.content ?? `# ${r.title}` } });
      expect(res.status()).toBe(201);
      resources.push({ id: ((await res.json()).resource as { id: string }).id, title: r.title });
    }
    sections.push({ id: section.id, title: s.title, resources });
  }
  return { courseId: course.id, slug: course.slug, title, sections };
}

/** Alertas de la app (excluye el anunciador de rutas de Next, que también tiene role="alert"). */
export const appAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
