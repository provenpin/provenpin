import { check, format, type Options } from "prettier";

export const baseOptions = {
  semi: false,
  singleQuote: true,
} satisfies Options;

export type FormatParser = "typescript" | "json" | "markdown";

export function formatSource(
  source: string,
  parser: FormatParser,
  options: Options = {},
): Promise<string> {
  return format(source, { ...baseOptions, parser, ...options });
}

export function checkSource(
  source: string,
  parser: FormatParser,
  options: Options = {},
): Promise<boolean> {
  return check(source, { ...baseOptions, parser, ...options });
}

export function formatTypeScript(
  source: string,
  options: Options = {},
): Promise<string> {
  return formatSource(source, "typescript", options);
}

export function formatJson(
  source: string,
  options: Options = {},
): Promise<string> {
  return formatSource(source, "json", options);
}

export function formatMarkdown(
  source: string,
  options: Options = {},
): Promise<string> {
  return formatSource(source, "markdown", options);
}
