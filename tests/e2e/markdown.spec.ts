import { expect, test } from "@playwright/test";
import { STATE } from "./env";
import { apiAs, createCourseFixture } from "./helpers";

test.use({ storageState: STATE.student });

const MALICIOUS = `# Encabezado de prueba

| Columna A | Columna B |
|---|---|
| celda 1 | celda 2 |

\`\`\`ts
const saludo: string = "hola";
\`\`\`

<iframe src="https://www.youtube.com/embed/zQnBQ4tB3ZA" title="Vídeo permitido"></iframe>

<iframe src="https://evil.example.com/embed/zQnBQ4tB3ZA" title="Vídeo ajeno"></iframe>

<script>window.__pwned = "script"</script>

<img src="x" alt="roto" onerror="window.__pwned = 'onerror'">

<a href="/x" onclick="window.__pwned = 'onclick'">enlace con handler</a>

[enlace javascript](javascript:window.__pwned='href')
`;

test.describe("Markdown", () => {
  test("renderiza encabezados, tabla y código; solo permite el iframe de YouTube; no ejecuta HTML malicioso", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const fx = await createCourseFixture(admin, { sections: [{ title: "S", resources: [{ title: "Markdown", content: MALICIOUS }] }] });
    const resourceId = fx.sections[0]!.resources[0]!.id;

    const dialogs: string[] = [];
    page.on("dialog", async (d) => {
      dialogs.push(d.message());
      await d.dismiss();
    });

    await page.goto(`/student/courses/${fx.slug}/${resourceId}`);
    const content = page.getByTestId("resource-content");

    await expect(content.getByRole("heading", { name: "Encabezado de prueba", level: 1 })).toBeVisible();
    await expect(content.getByRole("table")).toBeVisible();
    await expect(content.getByRole("columnheader", { name: "Columna A" })).toBeVisible();
    await expect(content.getByRole("cell", { name: "celda 2" })).toBeVisible();
    await expect(content.locator("pre code")).toContainText('const saludo: string = "hola";');

    // Solo el iframe de YouTube sobrevive.
    const frames = content.locator("iframe");
    await expect(frames).toHaveCount(1);
    await expect(frames.first()).toHaveAttribute("src", "https://www.youtube.com/embed/zQnBQ4tB3ZA");
    expect(await frames.first().evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height)).toBeCloseTo(16 / 9, 1);

    // Nada del HTML malicioso llega al DOM ni se ejecuta.
    await expect(content.locator("script")).toHaveCount(0);
    await expect(content.locator("[onerror], [onclick]")).toHaveCount(0);
    await expect(content.locator('a[href^="javascript:"]')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: string }).__pwned)).toBeUndefined();
    expect(dialogs).toEqual([]);
  });
});

test.describe("Markdown: vista previa del editor", () => {
  test.use({ storageState: STATE.admin });

  test("usa el mismo sanitizador que el área del alumno", async ({ page, playwright }) => {
    const admin = await apiAs(playwright, "admin");
    const fx = await createCourseFixture(admin, { sections: [{ title: "S" }] });

    await page.goto(`/admin/courses/${fx.courseId}/resources/new?sectionId=${fx.sections[0]!.id}`);
    await page.getByLabel("Contenido (Markdown)").fill(MALICIOUS);
    const preview = page.getByTestId("markdown-preview");

    await expect(preview.getByRole("heading", { name: "Encabezado de prueba" })).toBeVisible();
    await expect(preview.locator("iframe")).toHaveCount(1);
    await expect(preview.locator("script, [onerror], [onclick]")).toHaveCount(0);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: string }).__pwned)).toBeUndefined();
  });
});
