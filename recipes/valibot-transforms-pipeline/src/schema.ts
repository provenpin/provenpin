import * as v from "valibot";

export const Email = v.pipe(v.string(), v.trim(), v.email(), v.toLowerCase());

export const UserId = v.pipe(
  v.string(),
  v.regex(/^usr_[a-z0-9]+$/),
  v.brand("UserId"),
);

export const CreateAccount = v.object({
  email: Email,
  displayName: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(40)),
  age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(13)), 18),
  tags: v.optional(v.pipe(v.array(v.pipe(v.string(), v.trim(), v.minLength(1))), v.maxLength(5)), []),
});

export type CreateAccountInput = v.InferInput<typeof CreateAccount>;
export type CreateAccountOutput = v.InferOutput<typeof CreateAccount>;

export function parseAccount(input: unknown) {
  const r = v.safeParse(CreateAccount, input);
  if (!r.success) {
    return {
      ok: false as const,
      issues: r.issues.map((i) => ({ path: i.path?.map((p) => p.key).join(".") ?? "", message: i.message })),
    };
  }
  return { ok: true as const, data: r.output };
}
