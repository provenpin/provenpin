import { fileTypeFromBuffer } from "file-type";

export type Detected = {
  ext: string;
  mime: string;
};

export async function detect(bytes: Uint8Array): Promise<Detected | undefined> {
  const result = await fileTypeFromBuffer(bytes);
  if (!result) {
    return undefined;
  }
  return { ext: result.ext, mime: result.mime };
}
