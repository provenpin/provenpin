import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, removeAdditional: "all", coerceTypes: true });
addFormats(ajv);

export const userSchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "name"],
  properties: {
    email: { type: "string", format: "email" },
    name: { type: "string", minLength: 1, maxLength: 80 },
    age: { type: "integer", minimum: 13 },
    website: { type: "string", format: "uri" },
    id: { type: "string", format: "uuid" },
  },
} as const;

export const validateUser = ajv.compile(userSchema);

export function fieldErrors(errors: ErrorObject[] | null | undefined) {
  const out: Record<string, string[]> = {};
  for (const e of errors ?? []) {
    const key = (e.instancePath || "/").replace(/^\//, "") || e.params?.missingProperty || "_";
    (out[key] ??= []).push(e.message ?? e.keyword);
  }
  return out;
}
