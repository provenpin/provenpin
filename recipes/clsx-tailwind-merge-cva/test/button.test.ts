import { test } from "node:test";
import assert from "node:assert/strict";
import { buttonClass, cn } from "../src/button.ts";

test("twMerge drops conflicting padding", () => {
  assert.equal(cn("px-2", "px-4"), "px-4");
});

test("cva applies intent and size", () => {
  const cls = buttonClass({ intent: "secondary", size: "lg" });
  assert.match(cls, /bg-gray-100/);
  assert.match(cls, /h-11/);
  assert.match(cls, /inline-flex/);
});

test("className merges on top of variants", () => {
  const cls = buttonClass({ intent: "primary", className: "w-full" });
  assert.match(cls, /bg-blue-600/);
  assert.match(cls, /w-full/);
});
