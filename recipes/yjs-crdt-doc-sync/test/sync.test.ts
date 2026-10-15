import { test } from "node:test";
import assert from "node:assert/strict";
import * as Y from "yjs";
import { syncDocs, newDoc, connect } from "../src/sync.ts";

test("concurrent text edits merge identically on both peers", () => {
  const a = newDoc(1), b = newDoc(2);
  a.getText("t").insert(0, "hello");
  syncDocs(a, b);
  a.getText("t").insert(5, " world");
  b.getText("t").insert(0, ">> ");
  syncDocs(a, b);
  assert.equal(a.getText("t").toString(), ">> hello world");
  assert.equal(b.getText("t").toString(), a.getText("t").toString());
});

test("concurrent map writes converge to the same winner", () => {
  const a = newDoc(1), b = newDoc(2);
  a.getMap("m").set("status", "draft-a");
  b.getMap("m").set("status", "draft-b");
  syncDocs(a, b);
  const va = a.getMap("m").get("status"), vb = b.getMap("m").get("status");
  assert.equal(va, vb);
  assert.ok(va === "draft-a" || va === "draft-b");
});

test("state-vector sync sends only the diff", () => {
  const a = newDoc(1), b = newDoc(2);
  a.getArray<number>("arr").push(Array.from({ length: 500 }, (_, i) => i));
  syncDocs(a, b);
  a.getArray<number>("arr").push([999]);
  const { bBytes, aBytes } = syncDocs(a, b);
  assert.ok(bBytes < 50, `diff should be tiny, got ${bBytes}`);
  assert.ok(aBytes <= 2);
  assert.equal(b.getArray<number>("arr").length, 501);
});

test("live relay plus undo manager", () => {
  const a = newDoc(1), b = newDoc(2);
  const stop = connect(a, b);
  const undo = new Y.UndoManager(a.getText("t"));
  a.getText("t").insert(0, "abc");
  assert.equal(b.getText("t").toString(), "abc");
  undo.undo();
  assert.equal(b.getText("t").toString(), "");
  stop();
  a.getText("t").insert(0, "x");
  assert.equal(b.getText("t").toString(), "");
});

test("updates can be merged and replayed in any order", () => {
  const a = newDoc(1);
  const updates: Uint8Array[] = [];
  a.on("update", (u: Uint8Array) => updates.push(u));
  a.getText("t").insert(0, "one ");
  a.getText("t").insert(4, "two");
  const c = newDoc(3);
  Y.applyUpdate(c, Y.mergeUpdates(updates.reverse()));
  assert.equal(c.getText("t").toString(), "one two");
});
