import { parseHTML } from "linkedom";

export type PageInfo = { title: string; description: string | null; og: Record<string, string>; links: string[] };

export function extractInfo(html: string, baseUrl: string): PageInfo {
  const { document } = parseHTML(html);
  const og: Record<string, string> = {};
  for (const m of document.querySelectorAll('meta[property^="og:"]')) {
    og[m.getAttribute("property")!.slice(3)] = m.getAttribute("content") ?? "";
  }
  const links = [...document.querySelectorAll("a[href]")]
    .map((a) => new URL(a.getAttribute("href")!, baseUrl).href)
    .filter((href, i, all) => href.startsWith("http") && all.indexOf(href) === i);
  return {
    title: document.querySelector("title")?.textContent?.trim() ?? "",
    description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
    og,
    links,
  };
}

/** Absolutize links and images, lazy-load images, and drop inline scripts. */
export function rewrite(html: string, baseUrl: string): string {
  const { document } = parseHTML(html);
  for (const a of document.querySelectorAll("a[href]")) a.setAttribute("href", new URL(a.getAttribute("href")!, baseUrl).href);
  for (const img of document.querySelectorAll("img[src]")) {
    img.setAttribute("src", new URL(img.getAttribute("src")!, baseUrl).href);
    img.setAttribute("loading", "lazy");
  }
  for (const s of document.querySelectorAll("script:not([src])")) s.remove();
  return document.toString();
}
