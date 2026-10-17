import { parse, type HTMLElement } from "node-html-parser";

export type Product = {
  sku: string;
  name: string;
  href: string;
  price: number;
  discontinued: boolean;
};

export function extractProducts(root: HTMLElement): Product[] {
  return root.querySelectorAll("li.product").map((el) => {
    const link = el.querySelector("a.product-link");
    const classes = (el.getAttribute("class") ?? "").split(/\s+/);
    return {
      sku: el.getAttribute("data-sku") ?? "",
      name: link?.text.trim() ?? "",
      href: link?.getAttribute("href") ?? "",
      price: Number(el.getAttribute("data-price") ?? "0"),
      discontinued: classes.includes("discontinued"),
    };
  });
}

export function applyUpdates(root: HTMLElement): void {
  const heading = root.querySelector("#title");
  heading?.set_content("Updated Widgets");

  const first = root.querySelector('li.product[data-sku="A-1"]');
  if (first) {
    first.setAttribute("data-price", "15");
    first.querySelector(".price")?.set_content("$15");
  }

  root.querySelectorAll("li.discontinued").forEach((el) => el.remove());
}

export function processCatalog(html: string): {
  before: Product[];
  after: Product[];
  html: string;
} {
  const root = parse(html);
  const before = extractProducts(root);
  applyUpdates(root);
  const after = extractProducts(root);
  return { before, after, html: root.toString() };
}
