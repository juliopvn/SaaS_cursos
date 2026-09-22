import { expect, test } from "@playwright/test";
import { STATE } from "./env";
import { apiAs, createCourseFixture, uid, withDb, appAlert } from "./helpers";
import { ObjectId } from "mongodb";

test.use({ storageState: STATE.admin });

test.describe("Admin: CRUD de contenido", () => {
  test("crea un curso completo por la UI: curso → sección → recurso con markdown → edición", async ({ page }) => {
    const title = `Curso UI ${uid()}`;
    await page.goto("/admin/courses/new");
    await page.getByLabel("Título").fill(title);
    await expect(page.getByLabel("Slug")).toHaveValue(/^curso-ui-[0-9a-f]{8}$/);
    await page.getByRole("button", { name: "Crear curso" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/[0-9a-f]{24}$/);
    await expect(page.getByTestId("course-title")).toHaveText(title);
    await expect(page.getByTestId("outline-empty")).toBeVisible();

    await page.getByLabel("Nueva sección").fill("Introducción");
    await page.getByRole("button", { name: "Añadir sección" }).click();
    await expect(page.getByTestId("section-title")).toHaveText("Introducción");

    await page.getByRole("link", { name: "Añadir recurso a Introducción" }).click();
    await page.getByLabel("Título del recurso").fill("Primera lección");
    await page.getByLabel("Contenido (Markdown)").fill("# Hola\n\n- uno\n- dos\n");
    await expect(page.getByTestId("markdown-preview").getByRole("heading", { name: "Hola" })).toBeVisible();
    await page.getByRole("button", { name: "Crear recurso" }).click();
    await expect(page).toHaveURL(/\/resources\/[0-9a-f]{24}$/);

    await page.getByLabel("Título del recurso").fill("Primera lección (revisada)");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Recurso guardado.")).toBeVisible();

    await page.getByRole("link", { name: "Volver al curso" }).click();
    await expect(page.getByTestId("resource-item")).toContainText("Primera lección (revisada)");
  });

  test("el slug no se pisa: un slug duplicado da error claro", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const fx = await createCourseFixture(admin);
    await page.goto("/admin/courses/new");
    await page.getByLabel("Título").fill("Otro curso distinto");
    await page.getByLabel("Slug").fill(fx.slug);
    await page.getByRole("button", { name: "Crear curso" }).click();
    await expect(appAlert(page)).toContainText("Ya existe un curso con ese slug");
  });

  test("valida el título en el servidor", async ({ page }) => {
    await page.goto("/admin/courses/new");
    await page.getByLabel("Título").fill("ab");
    await page.getByRole("button", { name: "Crear curso" }).click();
    await expect(appAlert(page)).toContainText("al menos 3 caracteres");
  });

  test("reordena secciones y recursos y el orden persiste tras recargar", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const fx = await createCourseFixture(admin, {
      sections: [
        { title: "Alfa", resources: [{ title: "A1" }, { title: "A2" }, { title: "A3" }] },
        { title: "Beta", resources: [{ title: "B1" }] },
      ],
    });
    await page.goto(`/admin/courses/${fx.courseId}`);
    const sectionTitles = () => page.getByTestId("section-title").allTextContents();
    const resourceTitles = () => page.getByTestId("resource-item").locator("a").allTextContents();

    expect(await sectionTitles()).toEqual(["Alfa", "Beta"]);
    await page.getByRole("button", { name: "Bajar la sección Alfa" }).click();
    await expect.poll(sectionTitles).toEqual(["Beta", "Alfa"]);

    await page.getByRole("button", { name: "Subir el recurso A3" }).click();
    await expect.poll(resourceTitles).toEqual(["B1", "A1", "A3", "A2"]);

    await page.reload();
    expect(await sectionTitles()).toEqual(["Beta", "Alfa"]);
    expect(await resourceTitles()).toEqual(["B1", "A1", "A3", "A2"]);
  });

  test("los extremos de la lista no se pueden mover", async ({ page, playwright }) => {
    const fx = await createCourseFixture(await apiAs(playwright, "admin"), {
      sections: [{ title: "Única", resources: [{ title: "R1" }, { title: "R2" }] }],
    });
    await page.goto(`/admin/courses/${fx.courseId}`);
    await expect(page.getByRole("button", { name: "Subir el recurso R1" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Bajar el recurso R2" })).toBeDisabled();
  });

  test("renombra una sección", async ({ page, playwright }) => {
    const fx = await createCourseFixture(await apiAs(playwright, "admin"), { sections: [{ title: "Vieja" }] });
    await page.goto(`/admin/courses/${fx.courseId}`);
    await page.getByRole("button", { name: "Renombrar" }).click();
    await page.getByLabel("Nuevo título de la sección").fill("Nueva");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByTestId("section-title")).toHaveText("Nueva");
  });

  test("publica y despublica: el student ve u obtiene 404 según el estado", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const student = await apiAs(playwright, "student");
    const fx = await createCourseFixture(admin, { published: false });

    await page.goto(`/admin/courses/${fx.courseId}`);
    await expect(page.locator("span.badge").first()).toHaveText("Borrador");
    expect((await student.get(`/api/courses/${fx.courseId}`)).status()).toBe(404);

    await page.getByLabel("Publicado").check();
    await page.getByRole("button", { name: "Guardar cambios" }).first().click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    expect((await student.get(`/api/courses/${fx.courseId}`)).status()).toBe(200);

    await page.getByLabel("Publicado").uncheck();
    await page.getByRole("button", { name: "Guardar cambios" }).first().click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    expect((await student.get(`/api/courses/${fx.courseId}`)).status()).toBe(404);
  });

  test("elimina un recurso y una sección con confirmación", async ({ page, playwright }) => {
    const fx = await createCourseFixture(await apiAs(playwright, "admin"), {
      sections: [
        { title: "Se queda", resources: [{ title: "Recurso que se va" }, { title: "Recurso que se queda" }] },
        { title: "Se va", resources: [{ title: "Recurso huérfano" }] },
      ],
    });
    await page.goto(`/admin/courses/${fx.courseId}`);

    await page.getByRole("button", { name: "Eliminar el recurso Recurso que se va" }).click();
    await page.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page.getByTestId("resource-item")).toHaveCount(2);

    await page.getByRole("button", { name: "Eliminar la sección Se va" }).click();
    await page.getByRole("button", { name: "Cancelar" }).click(); // cancelar no borra
    await expect(page.getByTestId("section-item")).toHaveCount(2);
    await page.getByRole("button", { name: "Eliminar la sección Se va" }).click();
    await page.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page.getByTestId("section-item")).toHaveCount(1);
  });

  test("eliminar un curso borra en cascada secciones, recursos y feedback", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const student = await apiAs(playwright, "student");
    const fx = await createCourseFixture(admin, { sections: [{ title: "S", resources: [{ title: "R" }] }] });
    const resourceId = fx.sections[0]!.resources[0]!.id;
    const fb = await student.post("/api/feedback", { data: { resourceId, text: "comentario que debe desaparecer" } });
    expect(fb.status()).toBe(201);

    await page.goto(`/admin/courses/${fx.courseId}`);
    await page.getByRole("button", { name: "Eliminar curso" }).click();
    await page.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    const remaining = await withDb(async (db) => ({
      courses: await db.collection("courses").countDocuments({ _id: new ObjectId(fx.courseId) }),
      sections: await db.collection("sections").countDocuments({ courseId: new ObjectId(fx.courseId) }),
      resources: await db.collection("resources").countDocuments({ courseId: new ObjectId(fx.courseId) }),
      feedback: await db.collection("feedback").countDocuments({ resourceId: new ObjectId(resourceId) }),
    }));
    expect(remaining).toEqual({ courses: 0, sections: 0, resources: 0, feedback: 0 });
  });

  test("la API rechaza un reordenamiento que no es una permutación exacta", async ({ playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const fx = await createCourseFixture(admin, { sections: [{ title: "A" }, { title: "B" }] });
    const res = await admin.post("/api/sections/reorder", { data: { parentId: fx.courseId, ids: [fx.sections[0]!.id] } });
    expect(res.status()).toBe(400);
  });
});
