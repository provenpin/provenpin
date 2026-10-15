import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

export type TocEntry = { depth: number; text: string };

type MdNode = { type: string; depth?: number; value?: string; children?: MdNode[] };

function textOf(node: MdNode): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(textOf).join("");
}

/** remark plugin: stores the heading outline on file.data.toc */
export function remarkToc() {
  return (tree: MdNode, file: { data: Record<string, unknown> }) => {
    const toc: TocEntry[] = [];
    visit(tree as any, "heading", (node: any) => {
      toc.push({ depth: node.depth, text: textOf(node) });
    });
    file.data.toc = toc;
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkToc)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

export async function renderMarkdown(md: string): Promise<{ html: string; toc: TocEntry[] }> {
  const file = await processor.process(md);
  return { html: String(file), toc: (file.data.toc as TocEntry[]) ?? [] };
}
