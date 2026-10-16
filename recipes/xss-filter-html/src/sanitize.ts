import xss from "xss";

export const safeTags: string[] = [
  "a",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
];

export const whiteList: Record<string, string[]> = {
  a: ["href", "title"],
  b: [],
  strong: [],
  i: [],
  em: [],
  u: [],
  p: [],
  br: [],
  ul: [],
  ol: [],
  li: [],
  code: [],
  pre: [],
  blockquote: [],
  h1: [],
  h2: [],
  h3: [],
};

export function sanitizeHtml(input: string): string {
  return xss(input, {
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
    allowCommentTag: false,
  });
}
