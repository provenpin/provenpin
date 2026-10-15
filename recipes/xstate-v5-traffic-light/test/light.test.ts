import { test } from "node:test";
import assert from "node:assert/strict";
import { startLight } from "../src/light.ts";

test("cycles red -> green -> yellow -> red", () => {
  const light = startLight();
  assert.equal(light.value(), "red");
  light.next();
  assert.equal(light.value(), "green");
  assert.equal(light.cycles(), 1);
  light.next();
  assert.equal(light.value(), "yellow");
  light.next();
  assert.equal(light.value(), "red");
  light.stop();
});

test("emergency jumps to flashing then recovers", () => {
  const light = startLight();
  light.next();
  light.emergency();
  assert.equal(light.value(), "flashing");
  light.next();
  assert.equal(light.value(), "red");
  light.stop();
});
