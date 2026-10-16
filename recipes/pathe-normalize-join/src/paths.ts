import { join, normalize, basename, extname, dirname, relative } from "pathe";

export function joinPosix(...parts: string[]): string {
  return join(...parts);
}

export function normalizePosix(input: string): string {
  return normalize(input);
}

export function basenamePosix(input: string, suffix?: string): string {
  return suffix === undefined ? basename(input) : basename(input, suffix);
}

export function extnamePosix(input: string): string {
  return extname(input);
}

export function dirnamePosix(input: string): string {
  return dirname(input);
}

export function relativePosix(from: string, to: string): string {
  return relative(from, to);
}
