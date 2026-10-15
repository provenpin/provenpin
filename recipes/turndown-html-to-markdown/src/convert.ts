import TurndownService from "turndown";

export function createConverter() {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
  });

  td.remove(["script", "style"]);

  td.addRule("strikethrough", {
    filter: ["del", "s"],
    replacement: (content) => `~~${content}~~`,
  });

  // <figure><img><figcaption> becomes an image whose alt text is the caption.
  td.addRule("figure", {
    filter: "figure",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector("img");
      const caption = el.querySelector("figcaption")?.textContent?.trim() ?? img?.getAttribute("alt") ?? "";
      return img ? `\n\n![${caption}](${img.getAttribute("src")})\n\n` : "";
    },
  });

  return td;
}

const converter = createConverter();

export function htmlToMarkdown(html: string): string {
  return converter.turndown(html);
}
