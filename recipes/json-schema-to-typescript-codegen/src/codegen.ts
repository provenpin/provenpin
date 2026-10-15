import { compile, type JSONSchema } from "json-schema-to-typescript";

export const orderSchema: JSONSchema = {
  title: "Order",
  type: "object",
  additionalProperties: false,
  required: ["id", "status", "items"],
  properties: {
    id: { type: "string", description: "Order id, e.g. ord_123" },
    status: { type: "string", enum: ["pending", "paid", "shipped"] },
    note: { type: "string" },
    items: { type: "array", items: { $ref: "#/definitions/LineItem" }, minItems: 1 },
  },
  definitions: {
    LineItem: {
      type: "object",
      additionalProperties: false,
      required: ["sku", "qty"],
      properties: { sku: { type: "string" }, qty: { type: "integer", minimum: 1 } },
    },
  },
};

export async function generateTypes(schema: JSONSchema, name: string): Promise<string> {
  return compile(schema, name, {
    bannerComment: "/* Generated from JSON Schema. Do not edit. */",
    additionalProperties: false,
    strictIndexSignatures: true,
    style: { singleQuote: false, semi: true },
  });
}
