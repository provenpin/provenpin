import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { render } from "ink-testing-library";
import { Checklist, Countdown } from "../src/App.tsx";

const tasks = [{ id: "ppe", title: "PPE on" }, { id: "gas", title: "Gas test" }, { id: "permit", title: "Permit signed" }];
const tick = () => new Promise((r) => setTimeout(r, 30));
const ARROW_DOWN = "\u001B[B";
// Strip ANSI in case color is forced (CI sets FORCE_COLOR on some runners)
const plain = (s = "") => s.replace(/\u001B\[[0-9;]*m/g, "");

test("initial frame", () => {
  const { lastFrame, unmount } = render(createElement(Checklist, { tasks, onSubmit: () => {} }));
  assert.equal(plain(lastFrame()), "Pre-shift checklist (0/3)\n> [ ] PPE on\n  [ ] Gas test\n  [ ] Permit signed");
  unmount();
});

test("keyboard toggles and moves the cursor", async () => {
  const { lastFrame, stdin, unmount } = render(createElement(Checklist, { tasks, onSubmit: () => {} }));
  await tick();
  stdin.write(" ");
  await tick();
  stdin.write(ARROW_DOWN);
  await tick();
  stdin.write(ARROW_DOWN);
  await tick();
  stdin.write(" ");
  await tick();
  assert.equal(plain(lastFrame()), "Pre-shift checklist (2/3)\n  [x] PPE on\n  [ ] Gas test\n> [x] Permit signed");
  unmount();
});

test("enter submits selected ids", async () => {
  let got: string[] | null = null;
  const { stdin, unmount } = render(createElement(Checklist, { tasks, onSubmit: (d: string[]) => (got = d) }));
  await tick();
  stdin.write(ARROW_DOWN);
  await tick();
  stdin.write(" ");
  await tick();
  stdin.write("\r");
  await tick();
  assert.deepEqual(got, ["gas"]);
  unmount();
});

test("effects and timers re-render frames", async () => {
  let finished = false;
  const { lastFrame, frames, unmount } = render(createElement(Countdown, { from: 3, onDone: () => (finished = true) }));
  assert.equal(plain(lastFrame()), "Starting in 3");
  for (let i = 0; i < 20 && !finished; i++) await tick();
  assert.equal(plain(lastFrame()), "Go!");
  assert.ok(finished);
  assert.ok(frames.map(plain).includes("Starting in 1"));
  unmount();
});
