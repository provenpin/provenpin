// Local dev mode: serves the same handler on http://localhost:8787/mcp with Node's http module.
// Usage: npm run dev   (env: PORT, PROVENPIN_INDEX, PROVENPIN_PRO_ENABLED, PROVENPIN_API_KEYS, PROVENPIN_REQUIRE_KEY)
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createHandler } from "./mcp.ts";

const indexPath = process.env.PROVENPIN_INDEX ?? path.resolve(import.meta.dirname, "../../index/index.json");
const receiptsPath = path.join(path.dirname(indexPath), "receipts.json");
const handler = createHandler(JSON.parse(fs.readFileSync(indexPath, "utf8")), {
  proEnabled: process.env.PROVENPIN_PRO_ENABLED,
  receipts: fs.existsSync(receiptsPath) ? JSON.parse(fs.readFileSync(receiptsPath, "utf8")) : undefined,
  apiKeys: process.env.PROVENPIN_API_KEYS, requireKey: process.env.PROVENPIN_REQUIRE_KEY,
});
const port = +(process.env.PORT ?? 8787);

http.createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const r = await handler(new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers: req.headers as any, body: req.method === "GET" || req.method === "HEAD" ? undefined : body }));
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, () => console.log(`ProvenPin MCP dev server on http://localhost:${port}/mcp (index: ${indexPath})`));
