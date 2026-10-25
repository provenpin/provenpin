import { parse, stringify, type IParseOptions, type ParsedQs, type IStringifyOptions } from "qs";

export const DEFAULT_DEPTH = 5;

export function parseNested(input: string, options: IParseOptions = {}): ParsedQs {
  return parse(input, { depth: DEFAULT_DEPTH, ...options }) as ParsedQs;
}

// qs 6.16 stringify honours `depth` (RangeError past it), but @types/qs 6.15 only lists it for parse.
export type StringifyOptions = IStringifyOptions & { depth?: number };

export function stringifyNested(value: Record<string, unknown>, options: StringifyOptions = {}): string {
  const opts: StringifyOptions = { depth: DEFAULT_DEPTH, ...options };
  return stringify(value, opts);
}

export type Filter = {
  q?: string;
  tags: string[];
  price?: { min?: number; max?: number };
  inStock?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function parseFilter(input: string): Filter {
  const raw = parse(input, { depth: DEFAULT_DEPTH });
  const filter: Filter = { tags: [] };

  if (typeof raw.q === "string") filter.q = raw.q;

  const tags = raw.tags;
  if (typeof tags === "string") {
    filter.tags = [tags];
  } else if (Array.isArray(tags)) {
    filter.tags = tags.filter((tag): tag is string => typeof tag === "string");
  }

  const price = raw.price;
  if (isRecord(price)) {
    const min = toNumber(price.min);
    const max = toNumber(price.max);
    if (min !== undefined || max !== undefined) {
      filter.price = {};
      if (min !== undefined) filter.price.min = min;
      if (max !== undefined) filter.price.max = max;
    }
  }

  const inStock = raw.inStock;
  if (inStock === "true" || inStock === "1") {
    filter.inStock = true;
  } else if (inStock === "false" || inStock === "0") {
    filter.inStock = false;
  }

  return filter;
}

export function toQuery(filter: Filter, options: IStringifyOptions = {}): string {
  const payload: Record<string, unknown> = {};
  if (filter.q !== undefined) payload.q = filter.q;
  if (filter.tags.length > 0) payload.tags = filter.tags;
  if (filter.price !== undefined) payload.price = filter.price;
  if (filter.inStock !== undefined) payload.inStock = filter.inStock ? "true" : "false";
  return stringify(payload, { skipNulls: true, ...options });
}
