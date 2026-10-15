import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import nunjucks from "nunjucks";

export const BASE_TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <title>{% block title %}ProvenPin{% endblock %}</title>
  </head>
  <body>
    <header>{% block header %}<h1>ProvenPin</h1>{% endblock %}</header>
    <main>{% block content %}{% endblock %}</main>
  </body>
</html>
`;

export const MACROS_TEMPLATE = `{% macro badge(label, tone) %}<span class="badge badge--{{ tone | default("info") }}">{{ label }}</span>{% endmacro %}
`;

export const PROFILE_TEMPLATE = `{% extends "base.njk" %}

{% block title %}{{ pageTitle }}{% endblock %}

{% block header %}<h1>{{ user.name | shout }}</h1>{% endblock %}

{% block content %}
{% from "macros.njk" import badge %}
  {{ badge(user.role, "success") }}
  <p class="bio">{{ user.bio }}</p>
  <p class="excerpt">{{ user.bio | excerpt(12) }}</p>
  <div class="trusted">{{ user.bio | safe }}</div>
{% endblock %}
`;

export type User = { name: string; role: string; bio: string };

export function createEnvironment(dir: string): nunjucks.Environment {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(dir), {
    autoescape: true,
  });
  env.addFilter("shout", (value: unknown) => String(value).toUpperCase());
  env.addFilter("excerpt", (value: unknown, length: number) => {
    const text = String(value);
    return text.length > length ? `${text.slice(0, length)}…` : text;
  });
  return env;
}

export function writeTemplates(dir: string): void {
  writeFileSync(join(dir, "base.njk"), BASE_TEMPLATE);
  writeFileSync(join(dir, "macros.njk"), MACROS_TEMPLATE);
  writeFileSync(join(dir, "profile.njk"), PROFILE_TEMPLATE);
}

export function withTemplateDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "provenpin-nunjucks-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function renderProfile(user: User): string {
  return withTemplateDir((dir) => {
    writeTemplates(dir);
    const env = createEnvironment(dir);
    return env.render("profile.njk", {
      user,
      pageTitle: `${user.name} · profile`,
    });
  });
}

export function renderInline(source: string, context: Record<string, unknown>): string {
  return withTemplateDir((dir) => {
    const env = createEnvironment(dir);
    return env.renderString(source, context);
  });
}
