import { describe, expect, it } from "vitest";
import {
  authRequestInput,
  courseCreateInput,
  courseUpdateInput,
  feedbackCreateInput,
  isSafeNext,
  reorderInput,
  uploadInput,
} from "@/lib/validators";

const id = "64b7f0c2a1b2c3d4e5f60718";

describe("courseCreateInput", () => {
  it("autogenera el slug desde el título", () => {
    const parsed = courseCreateInput.parse({ title: "Diseño de APIs" });
    expect(parsed).toMatchObject({ slug: "diseno-de-apis", published: false, description: "" });
  });
  it("respeta un slug explícito válido", () => {
    expect(courseCreateInput.parse({ title: "Curso", slug: "mi-curso" }).slug).toBe("mi-curso");
  });
  it("rechaza títulos cortos y slugs inválidos", () => {
    expect(courseCreateInput.safeParse({ title: "ab" }).success).toBe(false);
    expect(courseCreateInput.safeParse({ title: "Curso", slug: "Mi Curso" }).success).toBe(false);
  });
});

describe("courseUpdateInput", () => {
  it("exige al menos un campo", () => expect(courseUpdateInput.safeParse({}).success).toBe(false));
  it("acepta cambios parciales", () => expect(courseUpdateInput.safeParse({ published: true }).success).toBe(true));
});

describe("authRequestInput", () => {
  it("normaliza el email", () => {
    expect(authRequestInput.parse({ email: "  Ana@Example.COM " }).email).toBe("ana@example.com");
  });
  it("descarta un next externo", () => {
    expect(authRequestInput.parse({ email: "a@b.co", next: "https://evil.com" }).next).toBeUndefined();
  });
  it("rechaza emails vacíos o incorrectos", () => {
    expect(authRequestInput.safeParse({ email: "" }).success).toBe(false);
    expect(authRequestInput.safeParse({ email: "no-es-email" }).success).toBe(false);
  });
});

describe("isSafeNext", () => {
  it.each(["/student", "/admin/courses?x=1", "/"])("acepta %s", (v) => expect(isSafeNext(v)).toBe(true));
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "student", "", "/a\nb", undefined, 5])(
    "rechaza %s",
    (v) => expect(isSafeNext(v)).toBe(false),
  );
});

describe("feedbackCreateInput", () => {
  it("recorta y acepta 1–2000 caracteres", () => {
    expect(feedbackCreateInput.parse({ resourceId: id, text: "  hola  " }).text).toBe("hola");
    expect(feedbackCreateInput.safeParse({ resourceId: id, text: "a".repeat(2000) }).success).toBe(true);
  });
  it("rechaza vacío, solo espacios y más de 2000", () => {
    expect(feedbackCreateInput.safeParse({ resourceId: id, text: "" }).success).toBe(false);
    expect(feedbackCreateInput.safeParse({ resourceId: id, text: "   " }).success).toBe(false);
    expect(feedbackCreateInput.safeParse({ resourceId: id, text: "a".repeat(2001) }).success).toBe(false);
  });
  it("rechaza ids que no son ObjectId", () => {
    expect(feedbackCreateInput.safeParse({ resourceId: "abc", text: "x" }).success).toBe(false);
  });
});

describe("reorderInput / uploadInput", () => {
  it("valida ids", () => {
    expect(reorderInput.safeParse({ parentId: id, ids: [id] }).success).toBe(true);
    expect(reorderInput.safeParse({ parentId: id, ids: [] }).success).toBe(false);
  });
  it("solo admite PDF e imágenes", () => {
    expect(uploadInput.safeParse({ filename: "a.pdf", contentType: "application/pdf", size: 10 }).success).toBe(true);
    expect(uploadInput.safeParse({ filename: "a.exe", contentType: "application/x-msdownload", size: 10 }).success).toBe(false);
    expect(uploadInput.safeParse({ filename: "a.svg", contentType: "image/svg+xml", size: 10 }).success).toBe(false);
  });
});
