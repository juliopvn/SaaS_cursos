import { expect, test } from "@playwright/test";
import { SEED_COURSES } from "../../scripts/seed-data";
import { STATE } from "./env";
import { apiAs, createCourseFixture } from "./helpers";

test.use({ storageState: STATE.student });

const rest = SEED_COURSES.find((c) => c.slug === "apis-rest-con-criterio")!;
const restOrder = rest.sections.flatMap((s) => s.resources.map((r) => r.title));

test.describe("Student", () => {
  test("ve los cursos publicados y no los borradores", async ({ page }) => {
    await page.goto("/student");
    const grid = page.getByTestId("course-grid");
    await expect(grid.getByText("TypeScript desde cero")).toBeVisible();
    await expect(grid.getByText("APIs REST con criterio")).toBeVisible();
    await expect(grid.getByText("Docker para desarrolladores")).toHaveCount(0);
  });

  test("un curso en borrador da 404 por URL directa", async ({ page }) => {
    const response = await page.goto("/student/courses/docker-para-desarrolladores");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Esta parada no existe." })).toBeVisible();
  });

  test("un recurso de un curso en borrador también da 404 (página y API)", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const student = await apiAs(playwright, "student");
    const fx = await createCourseFixture(admin, { published: false, sections: [{ title: "S", resources: [{ title: "R" }] }] });
    const resourceId = fx.sections[0]!.resources[0]!.id;

    const response = await page.goto(`/student/courses/${fx.slug}/${resourceId}`);
    expect(response?.status()).toBe(404);
    expect((await student.get(`/api/resources/${resourceId}`)).status()).toBe(404);
    expect((await student.get(`/api/courses/${fx.courseId}`)).status()).toBe(404);
    const list = (await (await student.get("/api/courses")).json()) as { courses: Array<{ id: string }> };
    expect(list.courses.map((c) => c.id)).not.toContain(fx.courseId);
  });

  test("un recurso no se puede abrir bajo el slug de otro curso", async ({ page }) => {
    const response = await page.goto("/student/courses/typescript-desde-cero/64b7f0c2a1b2c3d4e5f60718");
    expect(response?.status()).toBe(404);
  });

  test("navega por secciones y recursos en el orden pedagógico con anterior/siguiente", async ({ page }) => {
    await page.goto(`/student/courses/${rest.slug}`);
    await expect(page.getByTestId("course-title")).toHaveText(rest.title);
    await page.getByRole("link", { name: /Empezar por/ }).click();

    for (const [i, title] of restOrder.entries()) {
      await expect(page.getByTestId("resource-title")).toHaveText(title);
      if (i === 0) await expect(page.getByTestId("prev-link")).toHaveCount(0);
      if (i < restOrder.length - 1) await page.getByTestId("next-link").click();
    }
    await expect(page.getByTestId("next-link")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Volver al índice/ })).toBeVisible();

    // y hacia atrás
    await page.getByTestId("prev-link").click();
    await expect(page.getByTestId("resource-title")).toHaveText(restOrder[restOrder.length - 2]!);
  });

  test("respeta el orden cuando el admin lo cambia", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const fx = await createCourseFixture(admin, {
      sections: [
        { title: "Uno", resources: [{ title: "R-a" }, { title: "R-b" }] },
        { title: "Dos", resources: [{ title: "R-c" }] },
      ],
    });
    await admin.post("/api/sections/reorder", { data: { parentId: fx.courseId, ids: [fx.sections[1]!.id, fx.sections[0]!.id] } });
    await admin.post("/api/resources/reorder", { data: { parentId: fx.sections[0]!.id, ids: [fx.sections[0]!.resources[1]!.id, fx.sections[0]!.resources[0]!.id] } });

    await page.goto(`/student/courses/${fx.slug}`);
    await page.getByRole("link", { name: /Empezar por/ }).click();
    const expected = ["R-c", "R-b", "R-a"];
    for (const [i, title] of expected.entries()) {
      await expect(page.getByTestId("resource-title")).toHaveText(title);
      if (i < expected.length - 1) await page.getByTestId("next-link").click();
    }
  });

  test("el índice lateral marca el recurso actual", async ({ page }) => {
    await page.goto(`/student/courses/${rest.slug}`);
    await page.getByRole("link", { name: /Empezar por/ }).click();
    await expect(page.locator('a[aria-current="page"]').first()).toContainText(restOrder[0]!);
  });
});
