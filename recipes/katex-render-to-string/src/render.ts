import katex from "katex";

export type RenderOptions = {
  displayMode?: boolean;
  throwOnError?: boolean;
  macros?: Record<string, string>;
};

export function renderMath(tex: string, options: RenderOptions = {}): string {
  return katex.renderToString(tex, {
    displayMode: options.displayMode ?? false,
    throwOnError: options.throwOnError ?? true,
    macros: options.macros ?? {},
  });
}

export function isParseError(error: unknown): boolean {
  return error instanceof katex.ParseError;
}
