import slugify from "slugify";

export function toSlug(input: string) {
  return slugify(input, { lower: true, strict: true, trim: true });
}

export function uniqueSlug(input: string, existing: Set<string>) {
  const base = toSlug(input) || "item";
  if (!existing.has(base)) {
    existing.add(base);
    return base;
  }
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  const next = `${base}-${n}`;
  existing.add(next);
  return next;
}

export function productPath(category: string, title: string) {
  return `/${toSlug(category)}/${toSlug(title)}`;
}
