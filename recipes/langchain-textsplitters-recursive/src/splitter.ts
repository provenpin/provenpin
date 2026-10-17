import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const SAMPLE_MARKDOWN = [
  "# Field guide",
  "",
  "## Overview",
  "The recursive splitter walks a list of separators from coarse to fine. It first tries to break on headings, then on paragraphs, and only falls back to individual characters when a single run is still larger than the requested chunk size. This keeps semantically related sentences together while still respecting the hard limit.",
  "",
  "## Configuration",
  "Pass a chunkSize to cap the number of characters per chunk. Pass a chunkOverlap to repeat the tail of one chunk at the head of the next so context is not lost at the boundary. A larger overlap costs more tokens but produces smoother retrieval results for downstream question answering.",
  "",
  "## Markdown preset",
  "The markdown language preset adds separators for level one, two and three headings plus code fences and list markers. That ordering means the splitter prefers heading boundaries before paragraph boundaries before sentence boundaries before raw characters.",
  "",
  "## Metadata",
  "When you call createDocuments you can attach metadata that is copied onto every chunk. The splitter also records the line range of each chunk under the loc key so you can trace a chunk back to its source document.",
].join("\n");

export function createMarkdownSplitter(chunkSize = 200, chunkOverlap = 40) {
  return RecursiveCharacterTextSplitter.fromLanguage("markdown", {
    chunkSize,
    chunkOverlap,
  });
}

export async function splitMarkdown(
  text: string,
  metadata: Record<string, unknown> = {},
  chunkSize = 200,
  chunkOverlap = 40,
) {
  const splitter = createMarkdownSplitter(chunkSize, chunkOverlap);
  return splitter.createDocuments([text], [metadata]);
}

export function boundaryOverlap(a: string, b: string, max = 40): number {
  const limit = Math.min(max, a.length, b.length);
  for (let len = limit; len > 0; len -= 1) {
    if (a.slice(a.length - len) === b.slice(0, len)) {
      return len;
    }
  }
  return 0;
}
