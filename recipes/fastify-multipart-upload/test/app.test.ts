import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildApp, encodeForm } from "../src/app.ts";

test("uploads a file with fields", async () => {
  const app = await buildApp();
  const form = new FormData();
  form.append("note", "quarterly report");
  form.append("file", new Blob(["hello,world\n1,2\n"], { type: "text/csv" }), "data.csv");
  const res = await app.inject({ method: "POST", url: "/upload", ...(await encodeForm(form)) });
  assert.equal(res.statusCode, 201);
  const body = res.json();
  assert.deepEqual(body.fields, { note: "quarterly report" });
  assert.equal(body.files.length, 1);
  assert.equal(body.files[0].filename, "data.csv");
  assert.equal(body.files[0].mimetype, "text/csv");
  assert.equal(body.files[0].size, 16);
  assert.equal(body.files[0].sha256, createHash("sha256").update("hello,world\n1,2\n").digest("hex"));
  await app.close();
});

test("multiple files", async () => {
  const app = await buildApp();
  const form = new FormData();
  form.append("a", new Blob(["A"]), "a.txt");
  form.append("b", new Blob(["BB"]), "b.txt");
  const res = await app.inject({ method: "POST", url: "/upload", ...(await encodeForm(form)) });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json().files.map((f: { size: number }) => f.size), [1, 2]);
  await app.close();
});

test("oversized files are rejected with 413", async () => {
  const app = await buildApp(10);
  const form = new FormData();
  form.append("file", new Blob(["x".repeat(50)]), "big.bin");
  const res = await app.inject({ method: "POST", url: "/upload", ...(await encodeForm(form)) });
  assert.equal(res.statusCode, 413);
  await app.close();
});

test("non-multipart requests are refused", async () => {
  const app = await buildApp();
  const res = await app.inject({ method: "POST", url: "/upload", payload: { file: "nope" } });
  assert.equal(res.statusCode, 406);
  await app.close();
});
