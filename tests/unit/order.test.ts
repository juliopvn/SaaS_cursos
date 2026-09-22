import { describe, expect, it } from "vitest";
import { buildReorder, flattenReadingOrder, moveId, nextOrder } from "@/lib/order";

describe("nextOrder", () => {
  it("empieza en 1 sin elementos", () => expect(nextOrder([])).toBe(1));
  it("continúa tras el máximo aunque haya huecos", () => expect(nextOrder([1, 2, 7])).toBe(8));
});

describe("moveId", () => {
  const ids = ["a", "b", "c"];
  it("sube un elemento", () => expect(moveId(ids, "b", "up")).toEqual(["b", "a", "c"]));
  it("baja un elemento", () => expect(moveId(ids, "b", "down")).toEqual(["a", "c", "b"]));
  it("no cambia en los extremos", () => {
    expect(moveId(ids, "a", "up")).toEqual(ids);
    expect(moveId(ids, "c", "down")).toEqual(ids);
  });
  it("ignora ids desconocidos y no muta la entrada", () => {
    expect(moveId(ids, "x", "up")).toEqual(ids);
    expect(ids).toEqual(["a", "b", "c"]);
  });
});

describe("buildReorder", () => {
  it("numera de 1..n según la lista recibida", () => {
    expect(buildReorder(["a", "b", "c"], ["c", "a", "b"])).toEqual([
      { id: "c", order: 1 },
      { id: "a", order: 2 },
      { id: "b", order: 3 },
    ]);
  });
  it("rechaza ids de más, de menos, ajenos o duplicados", () => {
    expect(() => buildReorder(["a", "b"], ["a"])).toThrow();
    expect(() => buildReorder(["a", "b"], ["a", "b", "c"])).toThrow();
    expect(() => buildReorder(["a", "b"], ["a", "x"])).toThrow();
    expect(() => buildReorder(["a", "b"], ["a", "a"])).toThrow();
  });
});

describe("flattenReadingOrder", () => {
  it("concatena recursos respetando el orden de secciones", () => {
    const sections = [{ resources: [{ id: "1" }, { id: "2" }] }, { resources: [] }, { resources: [{ id: "3" }] }];
    expect(flattenReadingOrder(sections).map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});
