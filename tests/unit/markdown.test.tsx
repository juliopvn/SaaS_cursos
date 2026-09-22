import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/markdown";

const render = (md: string) => renderToStaticMarkup(<Markdown>{md}</Markdown>);

describe("<Markdown /> — contenido válido", () => {
  it("renderiza encabezados, listas, tabla GFM y código", () => {
    const html = render(
      "# Título\n\n- uno\n- dos\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```ts\nconst x = 1;\n```\n",
    );
    expect(html).toContain("<h1>Título</h1>");
    expect(html).toContain("<li>uno</li>");
    expect(html).toContain("<table>");
    expect(html).toContain('<code class="language-ts">');
  });

  it.each([
    "https://www.youtube.com/embed/zQnBQ4tB3ZA",
    "https://www.youtube-nocookie.com/embed/zQnBQ4tB3ZA?rel=0",
  ])("permite el iframe de YouTube %s", (src) => {
    const html = render(`<iframe src="${src}" title="Vídeo" allowfullscreen></iframe>`);
    expect(html).toContain("<iframe");
    expect(html).toContain(`src="${src}"`);
  });

  it("abre enlaces externos en pestaña nueva y deja los internos", () => {
    const html = render("[web](https://example.com) y [pdf](/api/files/uploads/x/a.pdf)");
    expect(html).toContain('href="https://example.com" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('<a href="/api/files/uploads/x/a.pdf">');
  });
});

describe("<Markdown /> — sanitización", () => {
  it("elimina <script>", () => {
    const html = render("Hola <script>alert(1)</script> mundo");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)</script>");
  });

  it("elimina handlers on* (onerror, onclick…)", () => {
    const html = render('<img src="x" onerror="alert(1)"> <a href="/a" onclick="alert(2)">a</a>');
    expect(html).not.toMatch(/onerror|onclick/i);
  });

  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html;base64,PHNjcmlwdD4="])(
    "bloquea el protocolo peligroso %s en enlaces",
    (href) => {
      const html = render(`[clic](${href}) <a href="${href}">html</a>`);
      expect(html).not.toMatch(/href="(javascript|data):/i);
    },
  );

  it.each([
    "https://evil.com/embed/zQnBQ4tB3ZA",
    "https://www.youtube.com.evil.com/embed/zQnBQ4tB3ZA",
    "http://www.youtube.com/embed/zQnBQ4tB3ZA",
    "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
  ])("bloquea el iframe con src no permitido: %s", (src) => {
    const html = render(`<iframe src="${src}"></iframe>`);
    expect(html).not.toContain(src);
  });

  it("bloquea otros elementos activos (object, embed, form, style)", () => {
    const html = render('<object data="x"></object><embed src="x"><form action="/x"><input></form><style>*{}</style>');
    expect(html).not.toMatch(/<(object|embed|form|style)/i);
  });
});
