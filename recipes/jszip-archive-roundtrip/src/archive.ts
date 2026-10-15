import JSZip from "jszip";

export type ArchiveContents = {
  text: string;
  binary: Uint8Array;
  nested: string;
};

export async function buildArchive(): Promise<Uint8Array> {
  const zip = new JSZip();
  const folder = zip.folder("docs");
  if (!folder) {
    throw new Error("failed to create folder");
  }
  folder.file("readme.txt", "hello from the docs folder");
  zip.file("data.bin", new Uint8Array([0, 1, 2, 255, 254]));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function listEntries(archive: Uint8Array): Promise<string[]> {
  const zip = await JSZip.loadAsync(archive);
  return Object.keys(zip.files).sort();
}

export async function readContents(archive: Uint8Array): Promise<ArchiveContents> {
  const zip = await JSZip.loadAsync(archive);

  const textFile = zip.file("docs/readme.txt");
  const binaryFile = zip.file("data.bin");
  if (!textFile || !binaryFile) {
    throw new Error("expected entries missing from archive");
  }

  const text = await textFile.async("string");
  const binary = await binaryFile.async("uint8array");
  const nested = await zip.folder("docs")!.file("readme.txt")!.async("string");

  return { text, binary, nested };
}
