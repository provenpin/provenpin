import { minify as terserMinify } from "terser";

export type MinifyResult = {
  code: string;
  map: string;
  originalBytes: number;
  minifiedBytes: number;
};

export async function minify(source: string, filename = "input.js"): Promise<MinifyResult> {
  const result = await terserMinify(
    { [filename]: source },
    {
      compress: { drop_console: true },
      mangle: true,
      sourceMap: { filename, url: `${filename}.map` },
    },
  );

  if (result.code == null) {
    throw new Error("terser produced no output");
  }

  const map =
    result.map == null
      ? ""
      : typeof result.map === "string"
        ? result.map
        : JSON.stringify(result.map);

  return {
    code: result.code,
    map,
    originalBytes: Buffer.byteLength(source, "utf8"),
    minifiedBytes: Buffer.byteLength(result.code, "utf8"),
  };
}
