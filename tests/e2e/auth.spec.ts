import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, BASE_URL } from "./env";
import { ORIGIN, getMagicLink, latestMessageId, loginViaUI, requestMagicLink, uniqueEmail, withDb } from "./helpers";

test.describe("Auth con magic link", () => {
  test("solicitar → email en MailHog → confirmar → sesión activa (usuario nuevo = student)", async ({ page }) => {
    const email = uniqueEmail();
    await loginViaUI(page, email);
    await expect(page).toHaveURL(/\/student$/);
    await expect(page.getByTestId("user-chip")).toContainText(email);
  });

  test("el enlace no consume el token al abrirse: hace falta pulsar Continuar", async ({ page, request }) => {
    const email = uniqueEmail();
    const url = await requestMagicLink(page, email);
    // Un escáner de correo hace GET al enlace: no debe invalidarlo.
    expect((await request.get(url)).status()).toBe(200);
    await page.goto(url);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/student$/);
  });

  test("un token reutilizado falla", async ({ page, browser }) => {
    const email = uniqueEmail();
    const url = await requestMagicLink(page, email);
    await page.goto(url);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/student$/);

    const other = await browser.newContext();
    const second = await other.newPage();
    await second.goto(url);
    await second.getByRole("button", { name: "Continuar" }).click();
    await expect(second).toHaveURL(/\/login\?error=invalid_link/);
    await expect(second.locator('p[role="alert"]')).toContainText("caducado o ya se usó");
    await other.close();
  });

  test("un token caducado falla", async ({ page }) => {
    const email = uniqueEmail();
    const url = await requestMagicLink(page, email);
    await withDb((db) => db.collection("magic_tokens").updateMany({ email }, { $set: { expiresAt: new Date(Date.now() - 60_000) } }));
    await page.goto(url);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/login\?error=invalid_link/);
  });

  test("un token inventado o manipulado falla", async ({ page }) => {
    await page.goto(`/auth/verify?token=${"a".repeat(43)}`);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/login\?error=invalid_link/);

    await page.goto("/auth/verify?token=corto");
    await expect(page.getByRole("heading", { name: "Enlace no válido" })).toBeVisible();
  });

  test("el token se guarda hasheado (nunca en claro) y con caducidad", async ({ page }) => {
    const email = uniqueEmail();
    const url = await requestMagicLink(page, email);
    const token = new URL(url).searchParams.get("token")!;
    const docs = await withDb((db) => db.collection("magic_tokens").find({ email }).toArray());
    expect(docs).toHaveLength(1);
    expect(docs[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(docs[0])).not.toContain(token);
    expect(docs[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  test("logout cierra la sesión", async ({ page }) => {
    await loginViaUI(page, uniqueEmail());
    await page.getByRole("button", { name: "Salir" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/student");
    await expect(page).toHaveURL(/\/login/);
  });

  test("respuesta genérica: igual para un email desconocido y para uno existente", async ({ request }) => {
    const unknown = await request.post("/api/auth/request", { data: { email: uniqueEmail() }, headers: ORIGIN });
    const existing = await request.post("/api/auth/request", { data: { email: "student3@example.com" }, headers: ORIGIN });
    expect(unknown.status()).toBe(200);
    expect(existing.status()).toBe(200);
    expect(await unknown.json()).toEqual(await existing.json());
  });

  test("no se crea el usuario hasta confirmar el enlace", async ({ request }) => {
    const email = uniqueEmail();
    await request.post("/api/auth/request", { data: { email }, headers: ORIGIN });
    const count = await withDb((db) => db.collection("users").countDocuments({ email }));
    expect(count).toBe(0);
  });

  test("rate limit por email: la sexta solicitud recibe 429", async ({ request }) => {
    const email = uniqueEmail();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await request.post("/api/auth/request", { data: { email }, headers: ORIGIN })).status());
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  test("las peticiones mutantes sin Origin válido se rechazan", async ({ request }) => {
    const noOrigin = await request.post("/api/auth/request", { data: { email: uniqueEmail() } });
    expect(noOrigin.status()).toBe(403);
    const evil = await request.post("/api/auth/request", { data: { email: uniqueEmail() }, headers: { Origin: "https://evil.example.com" } });
    expect(evil.status()).toBe(403);
  });

  test("el parámetro next externo se ignora (sin open-redirect)", async ({ page }) => {
    const email = uniqueEmail();
    const before = await latestMessageId(email);
    await page.goto(`/login?next=${encodeURIComponent("https://evil.example.com")}`);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Enviarme el enlace" }).click();
    await expect(page.getByText("Revisa tu correo")).toBeVisible();
    await page.goto((await getMagicLink(email, before)).url);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/student$`));
  });

  test("un next interno se respeta tras el login", async ({ page }) => {
    const email = uniqueEmail();
    const before = await latestMessageId(email);
    await page.goto("/student/courses/typescript-desde-cero");
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Enviarme el enlace" }).click();
    await page.goto((await getMagicLink(email, before)).url);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/student\/courses\/typescript-desde-cero$/);
  });

  test("el admin aterriza en /admin", async ({ page }) => {
    await loginViaUI(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Cursos", level: 1 })).toBeVisible();
  });

  test("el rol nunca viene del cliente: un email cualquiera no obtiene admin", async ({ page }) => {
    const email = uniqueEmail();
    await loginViaUI(page, email);
    const user = await withDb((db) => db.collection("users").findOne({ email }));
    expect(user?.role).toBe("student");
  });
});
