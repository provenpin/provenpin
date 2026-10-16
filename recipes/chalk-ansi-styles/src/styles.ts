import { Chalk } from "chalk";

export const ANSI_PATTERN = /\u001B\[[0-9;]*m/g;

export function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, "");
}

export function hasAnsi(input: string): boolean {
  return stripAnsi(input) !== input;
}

export function createStyler(level: 0 | 1 | 2 | 3 = 1): Chalk {
  return new Chalk({ level });
}

export function errorLabel(text: string, level: 0 | 1 | 2 | 3 = 1): string {
  return createStyler(level).bgBlue.bold.red(text);
}

export function nestedAccent(text: string, level: 0 | 1 | 2 | 3 = 1): string {
  const c = createStyler(level);
  return c.bold(`bold ${c.red.underline(text)} tail`);
}

export function successBadge(label: string, value: string, level: 0 | 1 | 2 | 3 = 1): string {
  const c = createStyler(level);
  return `${c.bgBlue.white.bold(` ${label} `)} ${c.green(value)}`;
}

export function statusLine(kind: string, message: string, level: 0 | 1 | 2 | 3 = 1): string {
  const c = createStyler(level);
  return `${c.bold.red(kind)} ${c.bgBlue.white(message)}`;
}
