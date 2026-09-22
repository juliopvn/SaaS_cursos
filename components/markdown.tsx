import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { markdownSchema } from "@/lib/markdown-schema";

const REMARK_PLUGINS = [remarkGfm];
// El orden importa: primero se interpreta el HTML embebido y después se sanitiza.
const REHYPE_PLUGINS = [rehypeRaw, [rehypeSanitize, markdownSchema]] as never;

/**
 * Render de markdown seguro, compartido por la vista previa del editor y el área del alumno.
 * `rehype-raw` permite HTML embebido; `rehype-sanitize` deja pasar solo iframes de YouTube.
 */
export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`markdown prose prose-neutral max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={{
          a: ({ node: _node, href, children: linkChildren, ...props }) => {
            const external = typeof href === "string" && /^https?:\/\//.test(href);
            return (
              <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {linkChildren}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
