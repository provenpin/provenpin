import { zipSync, unzipSync, strToU8, strFromU8, gzipSync, gunzipSync } from "fflate";

export function zipFiles(files: Record<string, string>) {
  const input: Record<string, Uint8Array> = {};
  for (const [name, text] of Object.entries(files)) input[name] = strToU8(text);
  return zipSync(input, { level: 6 });
}

export function unzipFiles(data: Uint8Array) {
  const out = unzipSync(data);
  const files: Record<string, string> = {};
  for (const [name, bytes] of Object.entries(out)) files[name] = strFromU8(bytes);
  return files;
}

export function gzipText(text: string) {
  return gzipSync(strToU8(text));
}

export function gunzipText(data: Uint8Array) {
  return strFromU8(gunzipSync(data));
}
