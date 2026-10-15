import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { createHash } from "node:crypto";

export async function buildApp(maxBytes = 1024) {
  const app = Fastify();
  await app.register(multipart, { limits: { fileSize: maxBytes, files: 3 } });

  app.post("/upload", async (req, reply) => {
    const fields: Record<string, string> = {};
    const files: Array<{ field: string; filename: string; mimetype: string; size: number; sha256: string }> = [];
    for await (const part of req.parts()) {
      if (part.type === "file") {
        const buf = await part.toBuffer(); // throws RequestFileTooLargeError (413) past the limit
        files.push({
          field: part.fieldname,
          filename: part.filename,
          mimetype: part.mimetype,
          size: buf.length,
          sha256: createHash("sha256").update(buf).digest("hex"),
        });
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }
    if (files.length === 0) return reply.code(400).send({ error: "no file" });
    return reply.code(201).send({ fields, files });
  });

  await app.ready();
  return app;
}

/** Encode a FormData with the platform's own multipart encoder (no extra deps). */
export async function encodeForm(form: FormData) {
  const res = new Response(form);
  return { payload: Buffer.from(await res.arrayBuffer()), headers: { "content-type": res.headers.get("content-type")! } };
}
