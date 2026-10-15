import { err, ok, Result, ResultAsync } from "neverthrow";

export class NotFoundError extends Error {
  readonly _tag = "NotFoundError" as const;
  constructor(readonly id: string) { super(`not found: ${id}`); }
}
export class InsufficientFunds extends Error {
  readonly _tag = "InsufficientFunds" as const;
  constructor(readonly balance: number, readonly amount: number) {
    super(`need ${amount}, have ${balance}`);
  }
}

type Account = { id: string; balance: number };
const db = new Map<string, Account>();

export function reset(seed: Account[] = []) {
  db.clear();
  for (const a of seed) db.set(a.id, { ...a });
}

export function getAccount(id: string): Result<Account, NotFoundError> {
  const a = db.get(id);
  return a ? ok({ ...a }) : err(new NotFoundError(id));
}

export function charge(id: string, amount: number): Result<Account, NotFoundError | InsufficientFunds> {
  return getAccount(id).andThen((a) => {
    if (a.balance < amount) return err(new InsufficientFunds(a.balance, amount));
    const next = { ...a, balance: a.balance - amount };
    db.set(id, next);
    return ok(next);
  });
}

export function chargeAsync(id: string, amount: number) {
  return ResultAsync.fromSafePromise(Promise.resolve(charge(id, amount))).andThen((r) => r);
}
