import boxen from "boxen";

export type BoxOptions = NonNullable<Parameters<typeof boxen>[1]>;

export function renderTerminalBox(text: string, options: BoxOptions = {}): string {
  return boxen(text, {
    borderStyle: "round",
    padding: 1,
    margin: 1,
    title: "status",
    dimBorder: true,
    ...options,
  });
}
