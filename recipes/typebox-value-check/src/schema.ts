import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export const CreateUser = Type.Object({
  email: Type.String({ format: "email" }),
  name: Type.String({ minLength: 1, maxLength: 80 }),
  age: Type.Optional(Type.Integer({ minimum: 13 })),
  tags: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { maxItems: 5 })),
}, { additionalProperties: false });

export type CreateUser = Static<typeof CreateUser>;

export function parseUser(input: unknown) {
  // TypeBox format checks need FormatRegistry for email; use pattern instead for offline purity
  const Schema = Type.Object({
    email: Type.String({ pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" }),
    name: Type.String({ minLength: 1, maxLength: 80 }),
    age: Type.Optional(Type.Integer({ minimum: 13 })),
    tags: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { maxItems: 5 })),
  }, { additionalProperties: false });

  if (!Value.Check(Schema, input)) {
    return {
      ok: false as const,
      errors: [...Value.Errors(Schema, input)].map((e) => ({ path: e.path, message: e.message })),
    };
  }
  return { ok: true as const, data: Value.Parse(Schema, input) };
}
