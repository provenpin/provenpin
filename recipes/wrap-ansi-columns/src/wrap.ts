import wrapAnsi from "wrap-ansi";

export type WrapOptions = {
  columns: number;
  hard?: boolean;
  trim?: boolean;
};

export function wrap(text: string, options: WrapOptions): string {
  const { columns, hard = false, trim = true } = options;
  return wrapAnsi(text, columns, { hard, trim });
}

export function wrapLines(text: string, options: WrapOptions): string[] {
  return wrap(text, options).split("\n");
}

export function visibleWidth(value: string): number {
  return value.replace(/\u001B\[[0-9;]*m/g, "").length;
}
