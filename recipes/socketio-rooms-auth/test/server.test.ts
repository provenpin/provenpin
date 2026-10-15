import { test } from "node:test";
import assert from "node:assert/strict";
import { io as connect, type Socket } from "socket.io-client";
import { startServer } from "../src/server.ts";

const tokens = { t1: "ada", t2: "bob", t3: "eve" };
const open = (url: string, token: string) => new Promise<Socket>((res, rej) => {
  const s = connect(url, { auth: { token }, transports: ["websocket"], reconnection: false });
  s.on("connect", () => res(s)); s.on("connect_error", rej);
});

test("rejects bad tokens", async () => {
  const srv = await startServer(tokens);
  await assert.rejects(open(srv.url, "nope"), /unauthorized/);
  await srv.close();
});

test("broadcasts only to room members", async () => {
  const srv = await startServer(tokens);
  const [a, b, c] = await Promise.all([open(srv.url, "t1"), open(srv.url, "t2"), open(srv.url, "t3")]);
  await a.emitWithAck("join", "dev"); await b.emitWithAck("join", "dev");
  let eveGot = false; c.on("message", () => { eveGot = true; });
  const got = new Promise((r) => b.on("message", r));
  a.emit("message", { room: "dev", text: "hi" });
  assert.deepEqual(await got, { from: "ada", text: "hi" });
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(eveGot, false);
  [a, b, c].forEach((s) => s.disconnect());
  await srv.close();
});
