import { expect, test } from "@playwright/test";
import { apiAs, appAlert, createCourseFixture } from "./helpers";

test.describe("Público", () => {
  test("la landing carga y muestra el CTA hacia el login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aprende en el orden correcto");
    await page.getByRole("link", { name: "Entrar con mi email" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("la landing lista los cursos publicados y oculta los borradores", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const published = await createCourseFixture(admin, { published: true, sections: [{ title: "S", resources: [{ title: "R1" }] }] });
    const draft = await createCourseFixture(admin, { published: false, sections: [{ title: "S", resources: [{ title: "R1" }] }] });
    await page.goto("/");
    const list = page.getByTestId("landing-courses");
    await expect(list.getByText(published.title)).toBeVisible();
    await expect(page.getByText(draft.title)).toHaveCount(0);
  });

  test("/login valida email vacío e incorrecto", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Enviarme el enlace" }).click();
    await expect(appAlert(page)).toHaveText("Introduce tu email.");

    await page.getByLabel("Email").fill("no-es-un-email");
    await page.getByRole("button", { name: "Enviarme el enlace" }).click();
    await expect(appAlert(page)).toContainText("email válido");
  });

  for (const path of ["/admin", "/admin/courses/new", "/student", "/student/courses/typescript-desde-cero"]) {
    test(`${path} sin sesión redirige a /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?next=/);
      await expect(page.getByRole("heading", { name: "Entrar en Cursos" })).toBeVisible();
    });
  }

  test("una ruta inexistente muestra la página 404", async ({ page }) => {
    const response = await page.goto("/esta-parada-no-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Esta parada no existe." })).toBeVisible();
  });
});
