import stringWidth from "string-width";
import stripAnsi from "strip-ansi";

export function visibleWidth(input: string): number {
  return stringWidth(input);
}

export function strip(input: string): string {
  return stripAnsi(input);
}

export const RED = "\u001b[31m";
export const BOLD = "\u001b[1m";
export const RESET = "\u001b[0m";

export function colorize(text: string, codes: string[]): string {
  return codes.join("") + text + RESET;
}
