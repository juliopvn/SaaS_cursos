import { expect, test } from "@playwright/test";
import { STATE, STUDENT1 } from "./env";
import { apiAs, createCourseFixture, uid, appAlert } from "./helpers";

test.describe("Feedback", () => {
  test.use({ storageState: STATE.student });

  test("valida vacío y longitud, envía, y el alumno ve su comentario", async ({ page, playwright }) => {
    const fx = await createCourseFixture(await apiAs(playwright, "admin"), { sections: [{ title: "S", resources: [{ title: "Recurso con feedback" }] }] });
    await page.goto(`/student/courses/${fx.slug}/${fx.sections[0]!.resources[0]!.id}`);

    const send = page.getByRole("button", { name: "Enviar comentario" });
    await send.click();
    await expect(appAlert(page)).toHaveText("Escribe tu comentario antes de enviarlo.");

    await page.getByLabel("Tu comentario").fill("a".repeat(2001));
    await send.click();
    await expect(appAlert(page)).toContainText("2000");
    await expect(page.getByTestId("own-feedback")).toHaveCount(0);

    const text = `Muy claro ${uid()}`;
    await page.getByLabel("Tu comentario").fill(text);
    await send.click();
    await expect(page.getByText("Gracias, hemos recibido tu comentario.")).toBeVisible();
    await expect(page.getByTestId("own-feedback")).toContainText(text);
    await expect(page.getByLabel("Tu comentario")).toHaveValue("");

    await page.reload();
    await expect(page.getByTestId("own-feedback")).toContainText(text);
  });

  test("protege contra el doble envío", async ({ page, playwright }) => {
    const fx = await createCourseFixture(await apiAs(playwright, "admin"), { sections: [{ title: "S", resources: [{ title: "R" }] }] });
    await page.goto(`/student/courses/${fx.slug}/${fx.sections[0]!.resources[0]!.id}`);
    await page.getByLabel("Tu comentario").fill(`doble ${uid()}`);
    await page.getByRole("button", { name: "Enviar comentario" }).dblclick();
    await expect(page.getByText("Gracias, hemos recibido tu comentario.")).toBeVisible();
    await expect(page.getByTestId("own-feedback").locator("li")).toHaveCount(1);
  });

  test("la API valida el cuerpo y solo acepta recursos publicados", async ({ playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const student = await apiAs(playwright, "student");
    const draft = await createCourseFixture(admin, { published: false, sections: [{ title: "S", resources: [{ title: "R" }] }] });
    const resourceId = draft.sections[0]!.resources[0]!.id;

    expect((await student.post("/api/feedback", { data: { resourceId, text: "hola" } })).status()).toBe(404);
    expect((await student.post("/api/feedback", { data: { resourceId, text: "" } })).status()).toBe(400);
    expect((await student.post("/api/feedback", { data: { resourceId: "no-id", text: "x" } })).status()).toBe(400);
  });
});

test("el admin ve el feedback asociado al recurso y al alumno; otro alumno no lo ve", async ({ browser, playwright }) => {
  const admin = await apiAs(playwright, "admin");
  const fx = await createCourseFixture(admin, { sections: [{ title: "S", resources: [{ title: "Recurso comentado" }, { title: "Otro recurso" }] }] });
  const [target, other] = fx.sections[0]!.resources;
  const text = `Comentario privado ${uid()}`;

  const s1 = await apiAs(playwright, "student");
  expect((await s1.post("/api/feedback", { data: { resourceId: target!.id, text } })).status()).toBe(201);

  // Admin: vista agregada por curso, con recurso, alumno, texto y fecha.
  const adminCtx = await browser.newContext({ storageState: STATE.admin });
  const adminPage = await adminCtx.newPage();
  await adminPage.goto(`/admin/feedback?courseId=${fx.courseId}`);
  const row = adminPage.getByTestId("feedback-row").filter({ hasText: text });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Recurso comentado");
  await expect(row).toContainText(STUDENT1.name);
  await expect(row).toContainText(STUDENT1.email);

  // Filtrado por recurso: el otro recurso no tiene comentarios.
  await adminPage.goto(`/admin/feedback?courseId=${fx.courseId}&resourceId=${other!.id}`);
  await expect(adminPage.getByTestId("feedback-empty")).toBeVisible();
  await adminCtx.close();

  // Conteo en la estructura del curso.
  const adminCtx2 = await browser.newContext({ storageState: STATE.admin });
  const p2 = await adminCtx2.newPage();
  await p2.goto(`/admin/courses/${fx.courseId}`);
  await expect(p2.getByTestId("resource-item").filter({ hasText: "Recurso comentado" })).toContainText("1 comentario");
  await adminCtx2.close();

  // Otro alumno: ni en la página ni por API ve el comentario ajeno.
  const s2Ctx = await browser.newContext({ storageState: STATE.student2 });
  const s2Page = await s2Ctx.newPage();
  await s2Page.goto(`/student/courses/${fx.slug}/${target!.id}`);
  await expect(s2Page.getByTestId("feedback-section")).toBeVisible();
  await expect(s2Page.getByText(text)).toHaveCount(0);
  const s2Api = await apiAs(playwright, "student2");
  const own = (await (await s2Api.get(`/api/feedback?resourceId=${target!.id}`)).json()) as { feedback: unknown[] };
  expect(own.feedback).toEqual([]);
  await s2Ctx.close();
});

test.describe("Feedback: permisos de lectura", () => {
  test.use({ storageState: STATE.student });

  test("el student no puede listar el feedback de todos", async ({ request }) => {
    expect((await request.get("/api/feedback")).status()).toBe(403);
    expect((await request.get("/api/feedback?courseId=64b7f0c2a1b2c3d4e5f60718")).status()).toBe(403);
  });

  test("el student no accede a la vista de feedback del admin", async ({ page }) => {
    await page.goto("/admin/feedback");
    await expect(page).toHaveURL(/\/student$/);
  });
});
