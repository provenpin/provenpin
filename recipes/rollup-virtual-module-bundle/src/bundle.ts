import { rollup, type Plugin } from "rollup";

export type VirtualModules = Record<string, string>;

export function virtualModulesPlugin(modules: VirtualModules): Plugin {
  return {
    name: "virtual-modules",
    resolveId(source) {
      if (Object.prototype.hasOwnProperty.call(modules, source)) {
        return source;
      }
      return null;
    },
    load(id) {
      if (Object.prototype.hasOwnProperty.call(modules, id)) {
        return modules[id];
      }
      return null;
    },
  };
}

export async function bundleVirtual(
  input: string,
  modules: VirtualModules,
): Promise<string> {
  const bundle = await rollup({
    input,
    plugins: [virtualModulesPlugin(modules)],
  });
  try {
    const { output } = await bundle.generate({ format: "es" });
    const chunk = output[0];
    if (chunk.type !== "chunk") {
      throw new Error("expected a single chunk");
    }
    return chunk.code;
  } finally {
    await bundle.close();
  }
}
