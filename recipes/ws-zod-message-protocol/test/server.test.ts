import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { startServer, type ServerMsg } from "../src/server.ts";

let srv: ReturnType<typeof startServer>;
let port: number;

before(async () => {
  srv = startServer({ "tok-ada": "ada", "tok-bob": "bob" });
  port = await srv.ready;
});
after(() => srv.close());

/** Connects and buffers incoming messages so tests can await the next one in order. */
async function connect(token: string) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/?token=${token}`);
  const queue: ServerMsg[] = [];
  const waiters: ((m: ServerMsg) => void)[] = [];
  ws.on("message", (raw) => {
    const m = JSON.parse(raw.toString()) as ServerMsg;
    const w = waiters.shift();
    w ? w(m) : queue.push(m);
  });
  const next = () => new Promise<ServerMsg>((resolve) => { const m = queue.shift(); m ? resolve(m) : waiters.push(resolve); });
  await new Promise((r, j) => { ws.once("open", r); ws.once("error", j); });
  return { ws, next, send: (v: unknown) => ws.send(typeof v === "string" ? v : JSON.stringify(v)) };
}

test("rejects connections without a valid token", async () => {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/?token=nope`);
  const [code, reason] = await new Promise<[number, string]>((r) => ws.on("close", (c, why) => r([c, why.toString()])));
  assert.equal(code, 4401);
  assert.equal(reason, "unauthorized");
});

test("welcomes and answers ping", async () => {
  const c = await connect("tok-ada");
  assert.deepEqual(await c.next(), { type: "welcome", user: "ada" });
  c.send({ type: "ping", id: 7 });
  assert.deepEqual(await c.next(), { type: "pong", id: 7 });
  c.ws.close();
});

test("invalid frames get typed errors and the socket stays open", async () => {
  const c = await connect("tok-ada");
  await c.next();
  c.send("{not json");
  assert.deepEqual(await c.next(), { type: "error", code: "bad_json" });
  c.send({ type: "say", room: "general", text: "" });
  assert.deepEqual(await c.next(), { type: "error", code: "invalid", detail: "text" });
  c.send({ type: "shout" });
  assert.equal((await c.next() as { code: string }).code, "invalid");
  c.send({ type: "say", room: "general", text: "hi" });
  assert.deepEqual(await c.next(), { type: "error", code: "not_in_room" });
  assert.equal(c.ws.readyState, WebSocket.OPEN);
  c.ws.close();
});

test("broadcasts room messages to every member", async () => {
  const ada = await connect("tok-ada");
  const bob = await connect("tok-bob");
  await ada.next(); await bob.next();
  ada.send({ type: "join", room: "ops" });
  assert.deepEqual(await ada.next(), { type: "joined", room: "ops", members: 1 });
  bob.send({ type: "join", room: "ops" });
  assert.deepEqual(await bob.next(), { type: "joined", room: "ops", members: 2 });
  bob.send({ type: "say", room: "ops", text: "deploying" });
  const expected = { type: "message", room: "ops", from: "bob", text: "deploying" };
  assert.deepEqual(await ada.next(), expected);
  assert.deepEqual(await bob.next(), expected);
  ada.ws.close(); bob.ws.close();
});
