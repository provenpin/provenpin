import yazl from "yazl";
import yauzl from "yauzl";

export type EntryInput = { name: string; data: Buffer | string };

export function createZip(entries: EntryInput[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const zipfile = new yazl.ZipFile();
    const chunks: Buffer[] = [];

    zipfile.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zipfile.outputStream.on("error", reject);
    zipfile.outputStream.on("end", () => resolve(Buffer.concat(chunks)));

    for (const entry of entries) {
      const data =
        typeof entry.data === "string" ? Buffer.from(entry.data, "utf8") : entry.data;
      zipfile.addBuffer(data, entry.name);
    }

    zipfile.end();
  });
}

export function readZip(buffer: Buffer): Promise<Map<string, Buffer>> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err ?? new Error("failed to open zip"));
        return;
      }

      const entries = new Map<string, Buffer>();
      zipfile.on("error", reject);
      zipfile.on("end", () => resolve(entries));

      zipfile.on("entry", (entry) => {
        if (entry.fileName.endsWith("/")) {
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr || !readStream) {
            reject(streamErr ?? new Error("failed to open read stream"));
            return;
          }

          const chunks: Buffer[] = [];
          readStream.on("data", (chunk: Buffer) => chunks.push(chunk));
          readStream.on("error", reject);
          readStream.on("end", () => {
            entries.set(entry.fileName, Buffer.concat(chunks));
            zipfile.readEntry();
          });
        });
      });

      zipfile.readEntry();
    });
  });
}
