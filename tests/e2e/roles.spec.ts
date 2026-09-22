import { expect, test } from "@playwright/test";
import { STATE } from "./env";
import { ORIGIN } from "./helpers";

test.describe("Roles: student", () => {
  test.use({ storageState: STATE.student });

  test("un student que visita /admin es bloqueado y vuelve a su área", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/student$/);
    await page.goto("/admin/courses/new");
    await expect(page).toHaveURL(/\/student$/);
  });

  test("el student recibe 403 en las APIs de administración", async ({ request }) => {
    const id = "64b7f0c2a1b2c3d4e5f60718";
    const calls = [
      request.post("/api/courses", { data: { title: "Curso hackeado" }, headers: ORIGIN }),
      request.patch(`/api/courses/${id}`, { data: { published: true }, headers: ORIGIN }),
      request.delete(`/api/courses/${id}`, { headers: ORIGIN }),
      request.post("/api/sections", { data: { courseId: id, title: "x" }, headers: ORIGIN }),
      request.get(`/api/sections?courseId=${id}`),
      request.post("/api/sections/reorder", { data: { parentId: id, ids: [id] }, headers: ORIGIN }),
      request.post("/api/resources", { data: { sectionId: id, title: "x" }, headers: ORIGIN }),
      request.get(`/api/resources?sectionId=${id}`),
      request.post("/api/resources/reorder", { data: { parentId: id, ids: [id] }, headers: ORIGIN }),
      request.post("/api/uploads", { data: { filename: "a.pdf", contentType: "application/pdf", size: 10 }, headers: ORIGIN }),
      request.get("/api/feedback"),
    ];
    for (const response of await Promise.all(calls)) expect(response.status()).toBe(403);
  });
});

test.describe("Roles: admin", () => {
  test.use({ storageState: STATE.admin });

  test("el admin puede ver ambas áreas", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Cursos", level: 1 })).toBeVisible();
    await page.goto("/student");
    await expect(page.getByRole("heading", { name: "Cursos disponibles" })).toBeVisible();
  });

  test("el admin no puede enviar feedback como alumno", async ({ request }) => {
    const res = await request.post("/api/feedback", { data: { resourceId: "64b7f0c2a1b2c3d4e5f60718", text: "hola" }, headers: ORIGIN });
    expect(res.status()).toBe(403);
  });
});

test.describe("Roles: anónimo", () => {
  test("las APIs protegidas devuelven 401 sin sesión", async ({ request }) => {
    expect((await request.get("/api/courses")).status()).toBe(401);
    expect((await request.get("/api/feedback")).status()).toBe(401);
    expect((await request.post("/api/courses", { data: { title: "x" }, headers: ORIGIN })).status()).toBe(401);
  });
});
