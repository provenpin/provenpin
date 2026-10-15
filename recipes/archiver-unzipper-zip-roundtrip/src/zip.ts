import { ZipArchive } from "archiver";
import unzipper from "unzipper";
import { PassThrough, Readable } from "node:stream";

export type Entry = { name: string; content: string | Buffer };

/** Stream entries into a zip held in memory (archiver 8 is ESM and exports ZipArchive instead of the old archiver("zip") factory). */
export async function zipToBuffer(entries: Entry[], level = 9): Promise<Buffer> {
  const archive = new ZipArchive({ zlib: { level } });
  const sink = new PassThrough();
  const chunks: Buffer[] = [];
  sink.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<void>((res, rej) => { sink.on("end", res); archive.on("error", rej); });
  archive.pipe(sink);
  for (const e of entries) {
    if (typeof e.content === "string") archive.append(e.content, { name: e.name, date: new Date("2026-01-01T00:00:00Z") });
    else archive.append(Readable.from([e.content]), { name: e.name, date: new Date("2026-01-01T00:00:00Z") });
  }
  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}

/** Random-access read of the central directory. */
export async function listZip(buf: Buffer) {
  const dir = await unzipper.Open.buffer(buf);
  return dir.files.filter((f) => f.type === "File").map((f) => ({ path: f.path, size: f.uncompressedSize }));
}

export async function readEntry(buf: Buffer, path: string) {
  const dir = await unzipper.Open.buffer(buf);
  const f = dir.files.find((x) => x.path === path);
  return f ? (await f.buffer()) : null;
}

/** Streaming parse: walk entries in order without loading the whole archive. */
export async function streamEntries(buf: Buffer) {
  const out: Record<string, string> = {};
  const parser = Readable.from([buf]).pipe(unzipper.Parse({ forceStream: true }));
  for await (const entry of parser as AsyncIterable<unzipper.Entry>) {
    out[entry.path] = (await entry.buffer()).toString("utf8");
  }
  return out;
}
