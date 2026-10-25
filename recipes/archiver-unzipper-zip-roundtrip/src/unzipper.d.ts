// unzipper 0.12.5 ships no types and @types/unzipper is for 0.10, so this declares only the
// calls the recipe makes, as unzipper 0.12.5 lib/Open/directory.js and lib/parse.js define them.
declare module "unzipper" {
  import { Duplex, PassThrough } from "node:stream";
  namespace unzipper {
    interface File {
      path: string;
      type: "File" | "Directory";
      uncompressedSize: number;
      compressedSize: number;
      stream(password?: string): Entry;
      buffer(password?: string): Promise<Buffer>;
    }
    interface CentralDirectory {
      numberOfRecords: number;
      files: File[];
    }
    interface Entry extends PassThrough {
      path: string;
      type: "File" | "Directory";
      autodrain(): unknown;
      buffer(): Promise<Buffer>;
    }
    interface ParseOptions {
      verbose?: boolean;
      forceStream?: boolean;
    }
    const Open: {
      buffer(data: Buffer): Promise<CentralDirectory>;
    };
    function Parse(opts?: ParseOptions): Duplex;
  }
  export = unzipper;
}
