import mime from "mime-types";

export function typeFromExtension(extension: string): string | undefined {
  const type = mime.lookup(extension);
  return type === false ? undefined : type;
}

export function extensionFromType(type: string): string | undefined {
  const extension = mime.extension(type);
  return extension === false ? undefined : extension;
}

export function contentTypeFor(extension: string): string | undefined {
  const type = mime.contentType(extension);
  return type === false ? undefined : type;
}

export function charsetFor(type: string): string | undefined {
  const charset = mime.charset(type);
  return charset === false ? undefined : charset;
}
