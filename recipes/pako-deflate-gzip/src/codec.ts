import { deflate, gzip, inflate, ungzip } from "pako";

const decoder = new TextDecoder();

type LevelOptions = { level?: number };

function withLevel(level?: number): LevelOptions {
  return level === undefined ? {} : { level };
}

export function deflateBytes(input: Uint8Array, level?: number): Uint8Array {
  return deflate(input, withLevel(level));
}

export function inflateBytes(input: Uint8Array): Uint8Array {
  return inflate(input);
}

export function deflateText(input: string, level?: number): Uint8Array {
  return deflate(input, withLevel(level));
}

export function inflateText(input: Uint8Array): string {
  return decoder.decode(inflate(input));
}

export function gzipText(input: string, level?: number): Uint8Array {
  return gzip(input, withLevel(level));
}

export function ungzipText(input: Uint8Array): string {
  return decoder.decode(ungzip(input));
}
