declare module "object-hash" {
  export interface HashOptions {
    algorithm?: string;
    encoding?: "hex" | "buffer" | "base64" | "latin1";
    excludeValues?: boolean;
    ignoreUnknown?: boolean;
    respectFunctionProperties?: boolean;
    respectFunctionNames?: boolean;
    respectType?: boolean;
    replacer?: (value: unknown) => unknown;
    unorderedArrays?: boolean;
    unorderedSets?: boolean;
    unorderedObjects?: boolean;
    excludeKeys?: (key: string) => boolean;
  }

  export default function hash(value: unknown, options?: HashOptions): string;
}
