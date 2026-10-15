import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const ALLOWED = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt"],
    a: ["href", "name", "target", "rel"],
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export async function renderSafeMarkdown(source: string) {
  const html = await marked.parse(source, { async: true, gfm: true });
  return sanitizeHtml(html, ALLOWED);
}
