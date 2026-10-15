import { test } from "node:test";
import assert from "node:assert/strict";
import { createItemsClient } from "../src/client.ts";

test("caches fetch results until invalidated", async () => {
  let calls = 0;
  const api = createItemsClient(async (id) => {
    calls++;
    return { id, name: `item-${id}-${calls}` };
  });
  const a = await api.get(1);
  const b = await api.get(1);
  assert.equal(a.name, b.name);
  assert.equal(calls, 1);
  assert.equal(api.getCached(1)?.name, a.name);
  await api.invalidate(1);
  const c = await api.get(1);
  assert.equal(calls, 2);
  assert.notEqual(c.name, a.name);
});
