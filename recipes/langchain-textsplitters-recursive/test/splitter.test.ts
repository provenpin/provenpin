import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_MARKDOWN, splitMarkdown, boundaryOverlap } from "../src/splitter.ts";

const CHUNK_SIZE = 200;
const CHUNK_OVERLAP = 40;

test("splits markdown into chunks within the size limit", async () => {
  const docs = await splitMarkdown(
    SAMPLE_MARKDOWN,
    { source: "guide.md" },
    CHUNK_SIZE,
    CHUNK_OVERLAP,
  );
  assert.ok(docs.length > 1, "expected more than one chunk");
  for (const doc of docs) {
    assert.ok(
      doc.pageContent.length <= CHUNK_SIZE,
      `chunk of length ${doc.pageContent.length} exceeds ${CHUNK_SIZE}`,
    );
  }
});

test("keeps a chunkOverlap between consecutive chunks", async () => {
  const docs = await splitMarkdown(SAMPLE_MARKDOWN, {}, CHUNK_SIZE, CHUNK_OVERLAP);
  const chunks = docs.map((doc) => doc.pageContent);
  const overlaps = chunks
    .slice(1)
    .map((chunk, i) => boundaryOverlap(chunks[i], chunk, CHUNK_OVERLAP));
  assert.ok(
    overlaps.some((value) => value > 0),
    `expected overlap between chunks, got ${JSON.stringify(overlaps)}`,
  );
});

test("propagates metadata to every chunk", async () => {
  const docs = await splitMarkdown(
    SAMPLE_MARKDOWN,
    { source: "guide.md", lang: "en" },
    CHUNK_SIZE,
    CHUNK_OVERLAP,
  );
  for (const doc of docs) {
    assert.equal(doc.metadata.source, "guide.md");
    assert.equal(doc.metadata.lang, "en");
  }
});
