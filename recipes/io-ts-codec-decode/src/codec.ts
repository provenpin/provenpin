import * as t from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import type { Either } from "fp-ts/Either";

export interface PositiveIntBrand {
  readonly PositiveInt: unique symbol;
}

export const PositiveInt = t.brand(
  t.number,
  (n): n is t.Branded<number, PositiveIntBrand> =>
    Number.isInteger(n) && n > 0,
  "PositiveInt"
);

export type PositiveInt = t.BrandC<typeof t.number, PositiveIntBrand>;

export const Role = t.union([t.literal("admin"), t.literal("user")]);
export type Role = t.TypeOf<typeof Role>;

export const User = t.type({
  id: t.string,
  name: t.string,
  role: Role,
  tags: t.array(t.string),
  meta: t.partial({
    age: PositiveInt,
    nickname: t.string,
  }),
});

export type User = t.TypeOf<typeof User>;

export function decodeUser(input: unknown): Either<t.Errors, User> {
  return User.decode(input);
}

export function encodeUser(user: User): unknown {
  return User.encode(user);
}

export function explain(input: unknown): string[] {
  return PathReporter.report(User.decode(input));
}
