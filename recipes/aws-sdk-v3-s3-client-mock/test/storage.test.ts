import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mockClient } from "aws-sdk-client-mock";
import { sdkStreamMixin } from "@smithy/util-stream";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { Storage, createS3 } from "../src/storage.ts";

const s3Mock = mockClient(S3Client);
beforeEach(() => s3Mock.reset());

const storage = () => new Storage(createS3(), "uploads");

test("putJson sends the right command input", async () => {
  s3Mock.on(PutObjectCommand).resolves({ ETag: '"abc"' });
  assert.equal(await storage().putJson("a.json", { n: 1 }), '"abc"');
  const [call] = s3Mock.commandCalls(PutObjectCommand);
  assert.deepEqual(call.args[0].input, { Bucket: "uploads", Key: "a.json", Body: '{"n":1}', ContentType: "application/json", ServerSideEncryption: "AES256" });
});

test("getJson reads a streamed body and maps NoSuchKey to null", async () => {
  s3Mock.on(GetObjectCommand, { Key: "cfg.json" }).resolves({ Body: sdkStreamMixin(Readable.from([Buffer.from('{"theme":"dark"}')])) });
  s3Mock.on(GetObjectCommand, { Key: "gone.json" }).rejects(new NoSuchKey({ message: "missing", $metadata: {} }));
  assert.deepEqual(await storage().getJson("cfg.json"), { theme: "dark" });
  assert.equal(await storage().getJson("gone.json"), null);
});

test("listKeys follows continuation tokens across pages", async () => {
  s3Mock.on(ListObjectsV2Command)
    .resolvesOnce({ Contents: [{ Key: "img/1.png" }, { Key: "img/2.png" }], IsTruncated: true, NextContinuationToken: "t1" })
    .resolvesOnce({ Contents: [{ Key: "img/3.png" }], IsTruncated: false });
  assert.deepEqual(await storage().listKeys("img/"), ["img/1.png", "img/2.png", "img/3.png"]);
  const calls = s3Mock.commandCalls(ListObjectsV2Command);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args[0].input.ContinuationToken, "t1");
  assert.equal(calls[0].args[0].input.MaxKeys, 2);
});

test("deleteKeys batches by 1000 and surfaces per-key errors", async () => {
  s3Mock.on(DeleteObjectsCommand).resolvesOnce({}).resolvesOnce({ Errors: [{ Key: "k1000", Code: "AccessDenied" }] });
  const keys = Array.from({ length: 1001 }, (_, i) => `k${i}`);
  assert.deepEqual(await storage().deleteKeys(keys), ["k1000: AccessDenied"]);
  const calls = s3Mock.commandCalls(DeleteObjectsCommand);
  assert.deepEqual(calls.map((c) => c.args[0].input.Delete!.Objects!.length), [1000, 1]);
});

test("presigned URLs are signed locally with SigV4 query params", async () => {
  const url = new URL(await storage().downloadUrl("reports/q3.pdf", 600));
  assert.equal(url.hostname, "uploads.s3.us-east-1.amazonaws.com");
  assert.equal(url.pathname, "/reports/q3.pdf");
  assert.equal(url.searchParams.get("X-Amz-Algorithm"), "AWS4-HMAC-SHA256");
  assert.equal(url.searchParams.get("X-Amz-Expires"), "600");
  assert.match(url.searchParams.get("X-Amz-Credential")!, /^AKIDEXAMPLE\/\d{8}\/us-east-1\/s3\/aws4_request$/);
  assert.equal(s3Mock.calls().length, 0); // presigning never sends a request
});
