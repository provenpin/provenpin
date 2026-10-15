import matter from "gray-matter";
import { z } from "zod";

export const Frontmatter = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

export type Post = z.infer<typeof Frontmatter> & { slug: string; body: string; excerpt: string };

export class FrontmatterError extends Error {}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function parsePost(source: string): Post {
  // Passing options also disables gray-matter's string-keyed cache, so edits are always re-read.
  const file = matter(source, { excerpt: true, excerpt_separator: "<!-- more -->" });
  const fm = Frontmatter.safeParse(file.data);
  if (!fm.success) throw new FrontmatterError(z.prettifyError(fm.error));
  return {
    ...fm.data,
    slug: fm.data.slug ?? slugify(fm.data.title),
    body: file.content.trim(),
    excerpt: (file.excerpt ?? "").trim(),
  };
}

export function publishedSorted(sources: string[]): Post[] {
  return sources
    .map(parsePost)
    .filter((p) => !p.draft)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function writePost(body: string, data: z.input<typeof Frontmatter>): string {
  return matter.stringify(body, Frontmatter.parse(data));
}
