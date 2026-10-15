import { test, before } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { makeVariants, blurhashOf, placeholderPng } from "../src/pipeline.ts";

let photo: Buffer;

before(async () => {
  // Synthetic 1000x600 JPEG: red left half, blue right half, tagged with EXIF orientation 6 (rotate 90).
  const left = await sharp({ create: { width: 500, height: 600, channels: 3, background: "#d02020" } }).png().toBuffer();
  photo = await sharp({ create: { width: 1000, height: 600, channels: 3, background: "#2040d0" } })
    .composite([{ input: left, left: 0, top: 0 }])
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
});

test("fixture really carries EXIF orientation", async () => {
  const m = await sharp(photo).metadata();
  assert.equal(m.orientation, 6);
  assert.equal(m.width, 1000);
});

test("variants are auto-rotated, never upscaled, and stripped of EXIF", async () => {
  const v = await makeVariants(photo, [320, 640, 1280]);
  // upright size is 600x1000, so 1280 and 640 are skipped rather than upscaled
  assert.deepEqual(v.map((x) => [x.width, x.height]), [[320, 533]]);
  const all = await makeVariants(photo, [200, 600]);
  assert.deepEqual(all.map((x) => [x.width, x.height]), [[200, 333], [600, 1000]]);
  for (const x of all) assert.equal((await sharp(x.buffer).metadata()).exif, undefined);
});

test("rotated output is portrait and a webp", async () => {
  const [small] = await makeVariants(photo, [300]);
  const m = await sharp(small.buffer).metadata();
  assert.equal(m.format, "webp");
  assert.equal(m.width, 300);
  assert.equal(m.height, 500);
  assert.equal(m.orientation, undefined);
});

test("blurhash is stable and decodes back to a placeholder PNG", async () => {
  const a = await blurhashOf(photo);
  const b = await blurhashOf(photo);
  assert.equal(a, b);
  assert.equal(a.length, 4 + 2 * 4 * 3 - 2 + 2); // 1 size + 1 max AC + 4 DC + 2 per AC component
  const png = await placeholderPng(a);
  const m = await sharp(png).metadata();
  assert.deepEqual([m.format, m.width, m.height], ["png", 16, 12]);
});

test("placeholder colours follow the source: top is red, bottom is blue after rotation", async () => {
  const png = await placeholderPng(await blurhashOf(photo), 8, 8);
  const { data } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const px = (x: number, y: number) => { const i = (y * 8 + x) * 4; return { r: data[i], b: data[i + 2] }; };
  assert.ok(px(4, 0).r > px(4, 0).b, "top should be reddish");
  assert.ok(px(4, 7).b > px(4, 7).r, "bottom should be bluish");
  await assert.rejects(placeholderPng("not-a-hash"), /invalid blurhash/);
});
