import { expect, test } from "@playwright/test";

// Solo lectura y sin credenciales: se ejecuta también contra producción.
test.describe("Smoke @smoke", () => {
  test("/ responde 200 y muestra la landing @smoke", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aprende en el orden correcto");
    await expect(page.getByRole("link", { name: "Entrar con mi email" })).toBeVisible();
  });

  test("/login renderiza el formulario @smoke", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviarme el enlace" })).toBeVisible();
  });

  test("/api/health devuelve status ok y db ok @smoke", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: "ok", db: "ok" });
    expect(typeof body.commit).toBe("string");
    expect(Object.keys(body).sort()).toEqual(["commit", "db", "status"]); // sin filtrar nada más
  });

  test("/admin sin sesión redirige a /login @smoke", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("las cabeceras de seguridad están presentes @smoke", async ({ request }) => {
    const headers = (await request.get("/login")).headers();
    expect(headers["content-security-policy"]).toContain("frame-src https://www.youtube.com");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
