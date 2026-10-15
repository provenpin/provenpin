import { test } from "node:test";
import assert from "node:assert/strict";
import { Jimp, JimpMime } from "jimp";
import { fitWidth, size, squareThumb } from "../src/thumbs.ts";

const makePng = (w: number, h: number) => new Jimp({ width: w, height: h, color: 0x1ed67fff }).getBuffer(JimpMime.png);

test("square thumbnail from a wide image", async () => {
  assert.deepEqual(await size(await squareThumb(await makePng(400, 200), 64)), { w: 64, h: 64, mime: "image/png" });
});

test("fit width keeps aspect ratio and outputs jpeg", async () => {
  assert.deepEqual(await size(await fitWidth(await makePng(1000, 500), 250)), { w: 250, h: 125, mime: "image/jpeg" });
});

test("does not upscale small images", async () => {
  assert.equal((await size(await fitWidth(await makePng(100, 50), 250))).w, 100);
});

test("rejects non-images", async () => {
  await assert.rejects(squareThumb(Buffer.from("not an image")));
});
