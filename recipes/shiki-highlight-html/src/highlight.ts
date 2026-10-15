import {
  createHighlighter,
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
} from "shiki";

export const THEMES: BundledTheme[] = ["github-light", "github-dark"];
export const LANGS: BundledLanguage[] = ["ts", "json"];

export function loadHighlighter(): Promise<Highlighter> {
  return createHighlighter({ themes: THEMES, langs: LANGS });
}
