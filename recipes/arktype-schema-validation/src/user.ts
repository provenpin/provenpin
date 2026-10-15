import { type } from "arktype";

export const User = type({
  email: "string.email",
  name: "string > 0",
  age: "number.integer >= 13",
  role: "'admin' | 'member' | 'guest'",
});

export const CreateUser = type({
  email: "string.email",
  name: "string > 0",
  "age?": "number.integer >= 13",
  role: "'admin' | 'member' | 'guest' = 'member'",
}).pipe((u) => ({ ...u, age: u.age ?? 18 }));

export const Event = type({
  "+": "reject",
  kind: "'created'",
  id: "string > 0",
}).or({
  "+": "reject",
  kind: "'deleted'",
  id: "string > 0",
  reason: "string > 0",
});

export function parseUser(input: unknown) {
  const out = User(input);
  if (out instanceof type.errors) return { ok: false as const, problems: out.summary };
  return { ok: true as const, data: out };
}
