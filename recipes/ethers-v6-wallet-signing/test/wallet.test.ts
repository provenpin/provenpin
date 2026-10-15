import { test } from "node:test";
import assert from "node:assert/strict";
import { getAddress } from "ethers";
import {
  TEST_ADDRESS,
  createTestWallet,
  decodeErc20Transfer,
  encodeErc20Transfer,
  fromBaseUnits,
  parseErc20Transfer,
  recoverMailSigner,
  recoverMessageSigner,
  signMail,
  signMessage,
  toBaseUnits,
} from "../src/wallet.ts";

test("derives a deterministic address from the fixed private key", () => {
  const wallet = createTestWallet();
  assert.equal(getAddress(wallet.address), getAddress(TEST_ADDRESS));
});

test("signs and verifies a plain message", async () => {
  const wallet = createTestWallet();
  const message = "Hello ProvenPin";
  const signature = await signMessage(wallet, message);

  assert.equal(recoverMessageSigner(message, signature), getAddress(TEST_ADDRESS));
  assert.notEqual(recoverMessageSigner("tampered message", signature), getAddress(TEST_ADDRESS));
});

test("signs and verifies EIP-712 typed data", async () => {
  const wallet = createTestWallet();
  const mail = {
    from: TEST_ADDRESS,
    to: "0x000000000000000000000000000000000000dEaD",
    contents: "gm",
  };

  const signature = await signMail(wallet, mail);

  assert.equal(recoverMailSigner(mail, signature), getAddress(TEST_ADDRESS));
  assert.notEqual(
    recoverMailSigner({ ...mail, contents: "gn" }, signature),
    getAddress(TEST_ADDRESS),
  );
});

test("encodes and decodes an ERC-20 transfer call", () => {
  const to = "0x000000000000000000000000000000000000dEaD";
  const amount = 1_000_000n;
  const data = encodeErc20Transfer(to, amount);

  assert.ok(data.startsWith("0xa9059cbb"), "uses the transfer(address,uint256) selector");

  const decoded = decodeErc20Transfer(data);
  assert.equal(getAddress(decoded.to), getAddress(to));
  assert.equal(decoded.amount, amount);

  const parsed = parseErc20Transfer(data);
  assert.equal(parsed.name, "transfer");
  assert.equal(getAddress(parsed.to), getAddress(to));
  assert.equal(parsed.amount, amount);
});

test("parses and formats token units", () => {
  assert.equal(toBaseUnits("1.5", 18), 1_500_000_000_000_000_000n);
  assert.equal(toBaseUnits("1", 6), 1_000_000n);
  assert.equal(fromBaseUnits(1_500_000_000_000_000_000n, 18), "1.5");
  assert.equal(fromBaseUnits(1_000_000n, 6), "1.0");
});
