import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("quita acentos y signos", () => expect(slugify("Introducción a TypeScript")).toBe("introduccion-a-typescript"));
  it("colapsa separadores y recorta guiones", () => expect(slugify("  ¡Hola,   mundo! ")).toBe("hola-mundo"));
  it("limita la longitud sin terminar en guion", () => {
    const s = slugify("a".repeat(70) + " " + "b".repeat(30));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
});
