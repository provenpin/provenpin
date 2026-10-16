import Mustache from "mustache";

export type Part = { label: string };
export type Item = { name: string; qty: number; parts: Part[] };

export type OrderView = {
  customer: string;
  items: Item[];
  comments: string[];
};

const templates = {
  order: [
    "Hi {{customer}},",
    "{{#items}}",
    "- {{name}} x{{qty}}",
    "{{#parts}}",
    "  * {{label}}",
    "{{/parts}}",
    "{{/items}}",
    "{{^items}}",
    "No items.",
    "{{/items}}",
    "{{#comments}}",
    "> {{.}}",
    "{{/comments}}",
    "{{^comments}}",
    "No comments.",
    "{{/comments}}",
    "{{> signature}}",
  ].join("\n"),
  signature: "-- {{customer}}",
};

export function renderOrder(view: OrderView): string {
  return Mustache.render(templates.order, view, {
    signature: templates.signature,
  });
}

export function renderEscaped(value: string): string {
  return Mustache.render("{{value}}", { value });
}

export function renderTriple(value: string): string {
  return Mustache.render("{{{value}}}", { value });
}

export function renderAmpersand(value: string): string {
  return Mustache.render("{{&value}}", { value });
}
