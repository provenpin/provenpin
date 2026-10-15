import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyMessage } from "viem";
import {
  TEST_PRIVATE_KEY,
  account,
  decodeTransfer,
  encodeTransfer,
  fromBaseUnits,
  signAndVerifyMessage,
  signTypedDataAndRecover,
  toBaseUnits,
} from "../src/sign.ts";

const EXPECTED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

test("derives a deterministic account offline from the fixed key", () => {
  assert.equal(TEST_PRIVATE_KEY.length, 66);
  assert.equal(account.address.toLowerCase(), EXPECTED_ADDRESS.toLowerCase());
});

test("signs a message and verifies it offline", async () => {
  const { signature, valid } = await signAndVerifyMessage("hello provenpin");
  assert.match(signature, /^0x[0-9a-f]+$/);
  assert.equal(valid, true);
});

test("verifyMessage rejects a tampered message", async () => {
  const { signature } = await signAndVerifyMessage("hello provenpin");
  const valid = await verifyMessage({
    address: account.address,
    message: "hello tampered",
    signature,
  });
  assert.equal(valid, false);
});

test("signs EIP-712 typed data and recovers the signer", async () => {
  const { signature, recovered } = await signTypedDataAndRecover({
    token: "0x0000000000000000000000000000000000000001",
    to: "0x0000000000000000000000000000000000000002",
    value: 1_000_000n,
    nonce: 7n,
  });
  assert.match(signature, /^0x[0-9a-f]+$/);
  assert.equal(recovered.toLowerCase(), account.address.toLowerCase());
});

test("encodes and decodes an ERC-20 transfer call offline", () => {
  const amount = toBaseUnits("1.5", 18);
  assert.equal(amount, 1_500_000_000_000_000_000n);
  const data = encodeTransfer(EXPECTED_ADDRESS, amount);
  assert.equal(data.slice(0, 10), "0xa9059cbb");
  const decoded = decodeTransfer(data);
  assert.equal(decoded.to.toLowerCase(), EXPECTED_ADDRESS.toLowerCase());
  assert.equal(decoded.amount, amount);
  assert.equal(fromBaseUnits(amount, 18), "1.5");
});

test("parseUnits/formatUnits round-trip for 6 decimals", () => {
  const units = toBaseUnits("12.34", 6);
  assert.equal(units, 12_340_000n);
  assert.equal(fromBaseUnits(units, 6), "12.34");
});
