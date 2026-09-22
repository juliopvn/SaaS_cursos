import { describe, expect, it } from "vitest";
import { buildObjectKey, isValidObjectKey, sanitizeFilename } from "@/lib/storage";

describe("sanitizeFilename", () => {
  it("normaliza nombre y conserva extensión", () => {
    expect(sanitizeFilename("Guía de estilo (v2).PDF")).toBe("guia-de-estilo-v2.pdf");
  });
  it("evita rutas y nombres vacíos", () => {
    expect(sanitizeFilename("../../etc/passwd")).not.toContain("/");
    expect(sanitizeFilename("???.png")).toBe("fichero.png");
  });
});

describe("object keys", () => {
  it("las claves generadas son válidas", () => expect(isValidObjectKey(buildObjectKey("a.pdf"))).toBe(true));
  it.each(["../secret", "uploads/../x", "uploads/abc/a.pdf", "otra/ruta.pdf", "uploads/11111111-1111-1111-1111-111111111111/.env"])(
    "rechaza %s",
    (key) => expect(isValidObjectKey(key)).toBe(false),
  );
});
