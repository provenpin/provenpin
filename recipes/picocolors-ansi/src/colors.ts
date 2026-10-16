import { createColors } from "picocolors";

export const color = createColors(true);
export const plain = createColors(false);

export function status(ok: boolean, label: string): string {
  const paint = ok ? color.green : color.red;
  return `${paint(color.bold(label))} ${color.dim("done")}`;
}

export function badge(text: string): string {
  return color.bgYellow(color.black(text));
}
