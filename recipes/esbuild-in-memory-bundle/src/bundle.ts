import * as esbuild from "esbuild";

/** Virtual-file plugin: resolves bare imports from an in-memory map, so nothing touches disk. */
function virtualFs(files: Record<string, string>): esbuild.Plugin {
  return {
    name: "virtual-fs",
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        const key = args.path.replace(/^\.\//, "");
        if (key in files) return { path: key, namespace: "virtual" };
        if (args.path === "env:build") return { path: "env", namespace: "env" };
        return undefined;
      });
      build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => ({ contents: files[args.path], loader: args.path.endsWith(".ts") ? "ts" : "js" }));
      build.onLoad({ filter: /.*/, namespace: "env" }, () => ({ contents: JSON.stringify({ builtAt: "fixed" }), loader: "json" }));
    },
  };
}

export async function bundle(entry: string, files: Record<string, string>, opts: Partial<esbuild.BuildOptions> = {}) {
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    outfile: "out.js",
    format: "esm",
    platform: "neutral",
    metafile: true,
    logLevel: "silent",
    plugins: [virtualFs(files)],
    ...opts,
  });
  const out = result.outputFiles.find((f) => f.path.endsWith("out.js"))!;
  return { code: out.text, inputs: Object.keys(result.metafile!.inputs).sort(), warnings: result.warnings.length, files: result.outputFiles.map((f) => f.path.split("/").pop()) };
}

/** Run an ESM bundle string and return its exports. */
export async function evaluate(code: string) {
  return import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
}

export const transformTs = (src: string) => esbuild.transform(src, { loader: "ts", format: "esm", target: "es2020" });
