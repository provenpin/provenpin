import AdmZip from "adm-zip";

export type EntryInput = { path: string; data: string | Buffer };

function toContent(data: string | Buffer): Buffer {
  return typeof data === "string" ? Buffer.from(data, "utf8") : data;
}

export function buildZip(entries: EntryInput[]): AdmZip {
  const zip = new AdmZip();
  for (const entry of entries) {
    zip.addFile(entry.path, toContent(entry.data));
  }
  return zip;
}

export function pack(entries: EntryInput[]): Buffer {
  return buildZip(entries).toBuffer();
}

export function writeZip(entries: EntryInput[], targetPath: string): string {
  buildZip(entries).writeZip(targetPath);
  return targetPath;
}

export function openArchive(source: Buffer | string): AdmZip {
  return new AdmZip(source as string);
}

export function listEntries(source: Buffer | string): string[] {
  return openArchive(source)
    .getEntries()
    .map((entry) => entry.entryName);
}

export function readAsText(source: Buffer | string, entryPath: string): string {
  const entry = openArchive(source).getEntry(entryPath);
  if (!entry) {
    throw new Error(`entry not found: ${entryPath}`);
  }
  return entry.getData().toString("utf8");
}
