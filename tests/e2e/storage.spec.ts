import { expect, test } from "@playwright/test";
import { STATE } from "./env";
import { ORIGIN, apiAs, createCourseFixture, appAlert } from "./helpers";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Storage @storage", () => {
  test.use({ storageState: STATE.admin });

  test("el admin sube un PDF y una imagen, los inserta y el student los abre", async ({ page, browser, playwright }) => {
    const fx = await createCourseFixture(await apiAs(playwright, "admin"), { sections: [{ title: "S", resources: [{ title: "Con ficheros", content: "Texto inicial" }] }] });
    const resourceId = fx.sections[0]!.resources[0]!.id;

    await page.goto(`/admin/courses/${fx.courseId}/resources/${resourceId}`);
    const input = page.getByTestId("file-input");

    // El primer intento puede llegar antes de la hidratación de React: reintentamos hasta que responda.
    await expect(async () => {
      await input.setInputFiles({ name: "Apuntes de la clase.pdf", mimeType: "application/pdf", buffer: PDF });
      await expect(page.getByTestId("upload-snippet")).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByTestId("upload-snippet")).toContainText(/\[apuntes-de-la-clase\.pdf\]\(\/api\/files\/uploads\/[0-9a-f-]{36}\/apuntes-de-la-clase\.pdf\)/);
    await page.getByRole("button", { name: "Insertar en el contenido" }).click();

    await input.setInputFiles({ name: "diagrama.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByTestId("upload-snippet")).toContainText(/^!\[Describe la imagen\]\(\/api\/files\/uploads\//);
    await page.getByRole("button", { name: "Insertar en el contenido" }).click();

    const editor = page.getByLabel("Contenido (Markdown)");
    await expect(editor).toHaveValue(/apuntes-de-la-clase\.pdf[\s\S]*diagrama\.png/);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Recurso guardado.")).toBeVisible();

    // El student abre el recurso: enlace al PDF e imagen renderizada.
    const studentCtx = await browser.newContext({ storageState: STATE.student });
    const student = await studentCtx.newPage();
    await student.goto(`/student/courses/${fx.slug}/${resourceId}`);
    const pdfLink = student.locator('a[href^="/api/files/uploads/"][href$=".pdf"]');
    await expect(pdfLink).toBeVisible();
    const image = student.locator('img[src^="/api/files/uploads/"]');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);

    const pdfResponse = await studentCtx.request.get((await pdfLink.getAttribute("href"))!);
    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()["content-type"]).toContain("pdf");
    expect((await pdfResponse.body()).toString()).toContain("%PDF-1.4");
    await studentCtx.close();
  });

  test("sin sesión /api/files responde 401 y el student no puede subir", async ({ playwright }) => {
    const anonymous = await playwright.request.newContext({ baseURL: new URL(ORIGIN.Origin).origin, storageState: { cookies: [], origins: [] } });
    const res = await anonymous.get("/api/files/uploads/11111111-1111-1111-1111-111111111111/a.pdf", { maxRedirects: 0 });
    expect(res.status()).toBe(401);
    await anonymous.dispose();

    const student = await apiAs(playwright, "student");
    const up = await student.post("/api/uploads", { data: { filename: "a.pdf", contentType: "application/pdf", size: 10 } });
    expect(up.status()).toBe(403);
  });

  test("rechaza tipos no permitidos y ficheros demasiado grandes", async ({ playwright, page }) => {
    const admin = await apiAs(playwright, "admin");
    const badType = await admin.post("/api/uploads", { data: { filename: "virus.exe", contentType: "application/x-msdownload", size: 100 } });
    expect(badType.status()).toBe(400);
    const svg = await admin.post("/api/uploads", { data: { filename: "a.svg", contentType: "image/svg+xml", size: 100 } });
    expect(svg.status()).toBe(400);
    const big = await admin.post("/api/uploads", { data: { filename: "grande.pdf", contentType: "application/pdf", size: 50 * 1024 * 1024 } });
    expect(big.status()).toBe(413);

    // La UI también lo avisa antes de subir.
    const fx = await createCourseFixture(admin, { sections: [{ title: "S" }] });
    await page.goto(`/admin/courses/${fx.courseId}/resources/new?sectionId=${fx.sections[0]!.id}`);
    await expect(async () => {
      await page.getByTestId("file-input").setInputFiles({ name: "notas.txt", mimeType: "text/plain", buffer: Buffer.from("hola") });
      await expect(appAlert(page)).toContainText("Tipo no permitido", { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
  });

  test("las claves fuera de uploads/ no se sirven", async ({ playwright }) => {
    const student = await apiAs(playwright, "student");
    const res = await student.get("/api/files/secretos/config.pdf", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });
});
