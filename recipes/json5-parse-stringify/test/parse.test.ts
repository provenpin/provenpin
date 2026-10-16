import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConfig, stringifyConfig, type Config } from "../src/parse.ts";

const source = `
// ProvenPin sample config
{
  name: 'provenpin',
  retries: 0x10, // hex integer
  tags: ['offline', 'json5',],
  nested: {
    enabled: true,
    mask: 0xff,
  },
}
`;

test("parses JSON5 with comments, trailing commas, unquoted keys and hex numbers", () => {
  const config = parseConfig(source);
  assert.equal(config.name, "provenpin");
  assert.equal(config.retries, 16);
  assert.deepEqual(config.tags, ["offline", "json5"]);
  assert.equal(config.nested.enabled, true);
  assert.equal(config.nested.mask, 255);
});

test("stringify with options round-trips through the parser", () => {
  const config: Config = {
    name: "provenpin",
    retries: 3,
    tags: ["a", "b"],
    nested: { enabled: true, mask: 255 },
  };
  const pretty = stringifyConfig(config, 2);
  assert.ok(pretty.includes("\n"));
  assert.match(pretty, /name:\s*'provenpin'/);
  assert.deepEqual(parseConfig(pretty), config);

  const compact = stringifyConfig(config, 0);
  assert.ok(!compact.includes("\n"));
  assert.deepEqual(parseConfig(compact), config);
});

test("throws a SyntaxError on invalid input", () => {
  assert.throws(() => parseConfig("{ name: 'unterminated }"), SyntaxError);
});
