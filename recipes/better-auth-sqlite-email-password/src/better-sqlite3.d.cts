// better-sqlite3 13.0.3 ships no types and @types/better-sqlite3 is for 9.x, so this declares
// only the constructor the recipe calls, as better-sqlite3 13.0.3 lib/database.js defines it.
// better-sqlite3 is CommonJS, so this is a .d.cts: `export =` is only valid in a CommonJS-format declaration file.
// better-auth 1.7.10 types its `database` option as any under Node, so passing the Database to it is unchecked either way.
declare module "better-sqlite3" {
  namespace Database {
    interface Options {
      readonly?: boolean;
      fileMustExist?: boolean;
      timeout?: number;
      verbose?: ((message?: unknown, ...additionalArgs: unknown[]) => void) | null;
      nativeBinding?: string | object;
    }
  }
  class Database {
    constructor(filename?: string | Buffer, options?: Database.Options);
  }
  export = Database;
}
