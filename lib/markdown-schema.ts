import { defaultSchema, type Options } from "rehype-sanitize";

/** Solo se admiten embeds de YouTube (dominio estándar y "sin cookies") con un id de 11 caracteres. */
export const YOUTUBE_EMBED = /^https:\/\/(www\.youtube\.com|www\.youtube-nocookie\.com)\/embed\/[A-Za-z0-9_-]{11}(\?[A-Za-z0-9_=&%.-]*)?$/;

/**
 * Esquema de sanitización: parte del de GitHub (`defaultSchema`, que ya elimina <script>, `on*`
 * y `javascript:`) y añade únicamente <iframe> restringido a YouTube.
 * No relajar sin revisión de seguridad (ver AGENTS.md).
 */
export const markdownSchema: Options = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "iframe"],
  attributes: {
    ...defaultSchema.attributes,
    iframe: [
      ["src", YOUTUBE_EMBED],
      "title",
      "width",
      "height",
      "allowFullScreen",
      "loading",
      ["allow", /^[a-z-]+(; ?[a-z-]+)*$/],
      ["referrerPolicy", "strict-origin-when-cross-origin", "no-referrer"],
    ],
  },
};

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * Tras sanitizar, un <iframe> cuyo `src` no era de YouTube se queda sin `src`.
 * Lo eliminamos del árbol para que no quede ningún marco vacío.
 */
export function rehypeDropEmptyIframes() {
  const prune = (node: HastNode) => {
    if (!node.children) return;
    node.children = node.children.filter((c) => !(c.type === "element" && c.tagName === "iframe" && !c.properties?.src));
    node.children.forEach(prune);
  };
  return (tree: HastNode) => prune(tree);
}
