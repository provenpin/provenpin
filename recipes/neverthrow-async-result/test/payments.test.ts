import { test } from "node:test";
import assert from "node:assert/strict";
import { charge, chargeAsync, getAccount, reset } from "../src/payments.ts";

test("charge success and errors", async () => {
  reset([{ id: "a1", balance: 100 }]);
  assert.equal(getAccount("missing").isErr(), true);
  const ok = charge("a1", 40);
  assert.equal(ok.isOk(), true);
  if (ok.isOk()) assert.equal(ok.value.balance, 60);
  const poor = charge("a1", 1000);
  assert.equal(poor.isErr(), true);
  if (poor.isErr()) assert.equal(poor.error._tag, "InsufficientFunds");
  const asyncOk = await chargeAsync("a1", 10);
  assert.equal(asyncOk.isOk(), true);
});
