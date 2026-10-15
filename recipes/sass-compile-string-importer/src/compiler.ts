import * as sass from "sass";

export function createMemoryImporter(
  modules: Record<string, string>,
): sass.Importer<"sync"> {
  return {
    canonicalize(url: string): URL | null {
      return Object.prototype.hasOwnProperty.call(modules, url)
        ? new URL(`memory:${url}`)
        : null;
    },
    load(canonicalUrl: URL): sass.ImporterResult | null {
      const contents = modules[canonicalUrl.pathname];
      if (contents === undefined) return null;
      return { contents, syntax: "scss" };
    },
  };
}

export function compileWithModules(
  source: string,
  modules: Record<string, string>,
): string {
  const result = sass.compileString(source, {
    importers: [createMemoryImporter(modules)],
    style: "compressed",
  });
  return result.css;
}
