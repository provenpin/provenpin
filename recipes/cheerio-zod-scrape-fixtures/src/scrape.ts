import * as cheerio from "cheerio";
import { z } from "zod";

export const Product = z.object({
  sku: z.string().regex(/^[A-Z]{3}-\d{3}$/),
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  inStock: z.boolean(),
  url: z.url(),
  rating: z.number().min(0).max(5).nullable(),
});
export type Product = z.infer<typeof Product>;

/** "$1,299.50" -> 129950 */
export function parsePrice(text: string): number {
  const m = text.replace(/[,\s]/g, "").match(/(\d+)(?:\.(\d{1,2}))?/);
  if (!m) return NaN;
  return Number(m[1]) * 100 + Number((m[2] ?? "0").padEnd(2, "0"));
}

/**
 * Scrapes a product listing page. Each card is validated with Zod; bad cards are reported
 * instead of silently producing half-filled objects.
 */
export function scrapeListing(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const products: Product[] = [];
  const errors: { index: number; issues: string[] }[] = [];

  $("ul.products > li.product").each((index, el) => {
    const card = $(el);
    const href = card.find("a.title").attr("href");
    const ratingAttr = card.find("[data-rating]").attr("data-rating");
    const candidate = {
      sku: card.attr("data-sku"),
      name: card.find("a.title").text().trim(),
      priceCents: parsePrice(card.find(".price").first().text()),
      inStock: !card.hasClass("sold-out"),
      url: href ? new URL(href, pageUrl).toString() : undefined,
      rating: ratingAttr === undefined ? null : Number(ratingAttr),
    };
    const r = Product.safeParse(candidate);
    if (r.success) products.push(r.data);
    else errors.push({ index, issues: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) });
  });

  const next = $("nav.pagination a[rel=next]").attr("href");
  return { title: $("title").text().trim(), products, errors, nextPage: next ? new URL(next, pageUrl).toString() : null };
}

/** Reads a definition table (<dl>) into a record, e.g. a product spec sheet. */
export function scrapeSpecs(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const out: Record<string, string> = {};
  $("dl.specs dt").each((_, dt) => {
    out[$(dt).text().trim().toLowerCase()] = $(dt).next("dd").text().replace(/\s+/g, " ").trim();
  });
  return out;
}
