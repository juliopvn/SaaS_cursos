/** Utilidades puras para mantener la secuencia pedagógica (`order` numérico, base 1). */

export function nextOrder(orders: readonly number[]): number {
  return orders.length === 0 ? 1 : Math.max(...orders) + 1;
}

export type MoveDirection = "up" | "down";

/** Devuelve una copia con el elemento `id` intercambiado con su vecino. Sin cambios en los extremos. */
export function moveId(ids: readonly string[], id: string, direction: MoveDirection): string[] {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  const next = [...ids];
  if (index === -1 || target < 0 || target >= ids.length) return next;
  [next[index], next[target]] = [next[target] as string, next[index] as string];
  return next;
}

/**
 * Valida que `orderedIds` sea una permutación exacta de `existingIds` (sin faltas, sobras ni duplicados).
 * Devuelve la lista de `{ id, order }` lista para persistir, con order 1..n.
 */
export function buildReorder(
  existingIds: readonly string[],
  orderedIds: readonly string[],
): { id: string; order: number }[] {
  const existing = new Set(existingIds);
  const incoming = new Set(orderedIds);
  const valid =
    orderedIds.length === existingIds.length &&
    incoming.size === orderedIds.length &&
    orderedIds.every((id) => existing.has(id));
  if (!valid) throw new Error("La lista de ids no coincide con los elementos existentes");
  return orderedIds.map((id, i) => ({ id, order: i + 1 }));
}

/** Aplana un índice curso → secciones → recursos en el orden de lectura. */
export function flattenReadingOrder<T extends { id: string }>(
  sections: ReadonlyArray<{ resources: readonly T[] }>,
): T[] {
  return sections.flatMap((s) => s.resources);
}
