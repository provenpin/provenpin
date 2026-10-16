import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Eta } from "eta";

export type LayoutData = {
  title: string;
  body: string;
};

const LAYOUT = [
  "<!doctype html>",
  "<html>",
  "<head><title><%= it.title %></title></head>",
  "<body>",
  '<%~ include("./header.eta", { title: it.title }) %>',
  "<main><%~ it.body %></main>",
  "</body>",
  "</html>",
].join("\n");

const HEADER = "<header><h1><%= it.title %></h1></header>";

export function createViewsDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "eta-views-"));
  writeFileSync(join(dir, "layout.eta"), LAYOUT, "utf8");
  writeFileSync(join(dir, "header.eta"), HEADER, "utf8");
  return dir;
}

export function createEta(views: string): Eta {
  return new Eta({ views, autoEscape: true, varName: "it", cache: false });
}

export function renderLayout(eta: Eta, data: LayoutData): string {
  return eta.render("layout.eta", data);
}

export function renderInline(eta: Eta, template: string, data: Record<string, unknown>): string {
  return eta.renderString(template, data);
}

export function cleanupViews(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
