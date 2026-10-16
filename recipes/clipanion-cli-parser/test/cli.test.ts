import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { Cli } from "clipanion";
import { createCli } from "../src/cli.ts";

function capture() {
  let output = "";
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  return {
    stream,
    get output() {
      return output;
    },
  };
}

function makeContext() {
  const stdout = capture();
  const stderr = capture();

  return {
    stdout,
    stderr,
    context: {
      ...Cli.defaultContext,
      stdout: stdout.stream,
      stderr: stderr.stream,
    },
  };
}

test("runs the add command and exits 0", async () => {
  const cli = createCli();
  const { context, stdout } = makeContext();

  const code = await cli.run(["add", "--a", "1", "--b", "2"], context);

  assert.equal(code, 0);
  assert.equal(stdout.output, "3\n");
});

test("supports boolean flags", async () => {
  const cli = createCli();
  const { context, stdout, stderr } = makeContext();

  const code = await cli.run(["add", "--a", "2", "--b", "3", "--verbose"], context);

  assert.equal(code, 0);
  assert.equal(stdout.output, "5\n");
  assert.equal(stderr.output, "verbose: 2 + 3\n");
});

test("greet falls back to its default name", async () => {
  const cli = createCli();
  const { context, stdout } = makeContext();

  const code = await cli.run(["greet"], context);

  assert.equal(code, 0);
  assert.equal(stdout.output, "Hello, world\n");
});

test("greet honours --shout", async () => {
  const cli = createCli();
  const { context, stdout } = makeContext();

  const code = await cli.run(["greet", "--name", "ada", "--shout"], context);

  assert.equal(code, 0);
  assert.equal(stdout.output, "HELLO, ADA\n");
});

test("prints command help and exits 0", async () => {
  const cli = createCli();
  const { context, stdout } = makeContext();

  const code = await cli.run(["add", "--help"], context);

  assert.equal(code, 0);
  assert.match(stdout.output, /Usage/);
  assert.match(stdout.output, /--a/);
  assert.match(stdout.output, /--b/);
});

test("prints top-level help listing commands", async () => {
  const cli = createCli();
  const { context, stdout } = makeContext();

  const code = await cli.run(["--help"], context);

  assert.equal(code, 0);
  assert.match(stdout.output, /add/);
  assert.match(stdout.output, /greet/);
});

test("returns exit code 1 for a usage error", async () => {
  const cli = createCli();
  const { context, stdout, stderr } = makeContext();

  const code = await cli.run(["add", "--a", "1"], context);

  assert.equal(code, 1);
  assert.match(stdout.output + stderr.output, /--b/);
});

test("returns exit code 1 for an unknown command", async () => {
  const cli = createCli();
  const { context } = makeContext();

  const code = await cli.run(["nope"], context);

  assert.equal(code, 1);
});

test("prints the binary version", async () => {
  const cli = createCli();
  const { context, stdout } = makeContext();

  const code = await cli.run(["--version"], context);

  assert.equal(code, 0);
  assert.match(stdout.output, /1\.0\.0/);
});
