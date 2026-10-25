// ejs 7.0.1 ships no types and @types/ejs is for ejs 3, so this declares only the calls and
// options the recipe uses, as ejs 7.0.1 lib/esm/ejs.js defines them (sync render; renderFile
// with a callback, which gets (err) on failure and (null, html) on success).
declare module "ejs" {
  interface Options {
    strict?: boolean;
    localsName?: string;
    _with?: boolean;
    root?: string | string[];
    filename?: string;
    views?: string[];
    cache?: boolean;
  }
  type Data = Record<string, unknown>;
  type RenderFileCallback = (err: Error | null, html: string) => void;
  const ejs: {
    render(template: string, data?: Data, opts?: Options & { async?: false }): string;
    renderFile(path: string, data: Data, opts: Options & { async?: false }, cb: RenderFileCallback): void;
  };
  export default ejs;
}
