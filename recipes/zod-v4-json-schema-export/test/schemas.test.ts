import { test } from "node:test";
import assert from "node:assert/strict";
import Ajv2020 from "ajv/dist/2020.js";
import { Customer, customerInputSchema, customerOutputSchema } from "../src/schemas.ts";

const sample = {
  id: "5f0c6c1e-3b7a-4c1e-9a52-1d2f3e4a5b6c",
  email: "ada@example.com",
  name: "Ada",
  address: { street: "1 Main St", city: "Kenai", zip: "99611" },
};

test("exports draft 2020-12 with metadata and shared $defs", () => {
  const s = customerOutputSchema() as any;
  assert.equal(s.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(s.properties.address.$ref, "#/$defs/Address");
  assert.equal(s.$defs.Address.description, "Postal address");
  assert.equal(s.properties.email.format, "email");
  assert.equal(s.properties.id.format, "uuid");
  assert.equal(s.properties.name.maxLength, 80);
  assert.deepEqual(s.properties.tier.enum, ["free", "pro"]);
});

test("input vs output: defaulted fields are optional on input only", () => {
  const input = customerInputSchema() as any;
  const output = customerOutputSchema() as any;
  assert.equal(input.required.includes("tier"), false);
  assert.equal(output.required.includes("tier"), true);
  assert.equal(output.required.includes("tags"), false);
});

test("Ajv and Zod agree on the same data", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(customerInputSchema());
  assert.equal(validate(sample), true);
  assert.equal(Customer.safeParse(sample).success, true);

  const bad = { ...sample, address: { ...sample.address, zip: "9961" }, extra: 1 };
  assert.equal(validate(bad), false);
  assert.ok(validate.errors!.some((e) => e.instancePath === "/address/zip" && e.keyword === "pattern"));
  assert.equal(Customer.safeParse(bad).success, false);
});

test("parsing applies defaults that the output schema requires", () => {
  const parsed = Customer.parse(sample);
  assert.equal(parsed.tier, "free");
  const ajv = new Ajv2020({ strict: false });
  assert.equal(ajv.validate(customerOutputSchema(), parsed), true);
});
