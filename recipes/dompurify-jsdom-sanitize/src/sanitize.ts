import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const { window } = new JSDOM("");
const purify = createDOMPurify(window as unknown as Parameters<typeof createDOMPurify>[0]);

// Open external links in a new tab without leaking window.opener.
purify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("href")?.startsWith("http")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, { USE_PROFILES: { html: true } });
}

/** Comments and chat: only a few inline tags survive, everything else is unwrapped to text. */
export function sanitizeComment(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "code"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    KEEP_CONTENT: true,
  });
}

export function removedCount(dirty: string): number {
  purify.sanitize(dirty, { USE_PROFILES: { html: true } });
  return purify.removed.length;
}
