// pug 3.0.4 ships no types and @types/pug is for pug 2, so this declares only the two
// calls the recipe makes, as pug 3.0.4 lib/index.js defines them.
declare module "pug" {
  namespace pug {
    interface Options {
      filename?: string;
      basedir?: string;
      doctype?: string;
      pretty?: boolean | string;
      compileDebug?: boolean;
      self?: boolean;
      cache?: boolean;
    }
    type compileTemplate = (locals?: Record<string, unknown>) => string;
    function compile(source: string, options?: Options): compileTemplate;
    function compileFile(path: string, options?: Options): compileTemplate;
  }
  export = pug;
}
