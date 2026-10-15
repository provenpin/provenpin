import postcss, { type PluginCreator } from "postcss";
import autoprefixer from "autoprefixer";

/** Custom plugin: replace var-like tokens `theme(name)` with design tokens and convert px to rem. */
export const tokens: PluginCreator<{ tokens: Record<string, string>; rootPx?: number }> = (opts = { tokens: {} }) => {
  const root = opts.rootPx ?? 16;
  return {
    postcssPlugin: "provenpin-tokens",
    Declaration(decl) {
      decl.value = decl.value.replace(/theme\(([\w-]+)\)/g, (_, name: string) => {
        const v = opts.tokens[name];
        if (v === undefined) throw decl.error(`Unknown token ${name}`, { word: name });
        return v;
      });
      if (decl.prop.startsWith("font-size") || decl.prop.startsWith("padding") || decl.prop.startsWith("margin")) {
        decl.value = decl.value.replace(/(\d*\.?\d+)px/g, (_, n: string) => `${+(Number(n) / root).toFixed(4)}rem`);
      }
    },
    AtRule: {
      // @debug rules are stripped from production output
      debug(at) { at.remove(); },
    },
  };
};
tokens.postcss = true;

// Pin browsers explicitly so output never depends on the machine's browserslist or caniuse-lite age guesses.
export const BROWSERS = ["Safari 12", "Firefox 60", "Chrome 60", "ie 11"];

export async function build(css: string, t: Record<string, string>) {
  const result = await postcss([tokens({ tokens: t }), autoprefixer({ overrideBrowserslist: BROWSERS, grid: "autoplace" })]).process(css, { from: "in.css", to: "out.css", map: { inline: false } });
  return { css: result.css, map: result.map.toJSON(), warnings: result.warnings().map((w) => w.text) };
}
