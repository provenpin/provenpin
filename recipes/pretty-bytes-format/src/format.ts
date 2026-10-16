import prettyBytes from "pretty-bytes";

export type ByteFormatOptions = {
  signed?: boolean;
  bits?: boolean;
  binary?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatBytes(bytes: number, options: ByteFormatOptions = {}): string {
  return prettyBytes(bytes, options);
}
