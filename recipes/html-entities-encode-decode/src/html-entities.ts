import { encode, decode } from "html-entities";

export type EntityLevel = "xml" | "html4" | "html5" | "all";
export type EncodeModeName = "specialChars" | "nonAscii";

export function encodeHtml(
  input: string,
  mode: EncodeModeName = "specialChars",
  level: EntityLevel = "html5",
): string {
  return encode(input, { mode, level });
}

export function decodeHtml(input: string, level: EntityLevel = "html5"): string {
  return decode(input, { level });
}

export function escapeUserContent(input: string): string {
  return encodeHtml(input, "specialChars", "html5");
}

export function escapeAttribute(input: string): string {
  return encodeHtml(input, "specialChars", "xml");
}
