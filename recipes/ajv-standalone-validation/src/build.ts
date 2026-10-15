import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";

export const userSchema = {
  $id: "user",
  type: "object",
  required: ["email", "age"],
  additionalProperties: false,
  properties: {
    email: { type: "string", pattern: "^[^@\\s]+@[^@\\s]+$" },
    age: { type: "integer", minimum: 0 },
    plan: { type: "string", enum: ["free", "pro"], default: "free" },
  },
} as const;

export const querySchema = {
  $id: "query",
  type: "object",
  properties: { page: { type: "integer", minimum: 1, default: 1 }, q: { type: "string" } },
} as const;

/** Generates one ESM module exporting a validator per schema $id. */
export function buildValidators(outFile: string): string {
  const ajv = new Ajv({
    schemas: [userSchema, querySchema],
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    code: { source: true, esm: true },
  });
  const code = standaloneCode(ajv, { validateUser: "user", validateQuery: "query" });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, code);
  return code;
}
