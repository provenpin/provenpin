import iconv from "iconv-lite";

export const encodings = ["win1252", "shift_jis", "utf16le"] as const;
export type SupportedEncoding = (typeof encodings)[number];

export function supports(encoding: string): boolean {
  return iconv.encodingExists(encoding);
}

export function encode(text: string, encoding: SupportedEncoding): Buffer {
  if (!iconv.encodingExists(encoding)) {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }
  return iconv.encode(text, encoding);
}

export function decode(buffer: Buffer, encoding: SupportedEncoding): string {
  if (!iconv.encodingExists(encoding)) {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }
  return iconv.decode(buffer, encoding);
}

export function roundTrip(text: string, encoding: SupportedEncoding): string {
  return decode(encode(text, encoding), encoding);
}
