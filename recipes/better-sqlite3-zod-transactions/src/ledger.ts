import Database from "better-sqlite3";
import { z } from "zod";

export const Transfer = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  cents: z.number().int().positive(),
}).refine((t) => t.from !== t.to, { message: "from and to must differ", path: ["to"] });

const AccountRow = z.object({ id: z.string(), balance_cents: z.number().int() });
export type Account = z.infer<typeof AccountRow>;

export class InsufficientFunds extends Error {}

/** A tiny double-entry ledger on better-sqlite3 using synchronous transactions. */
export function openLedger(file = ":memory:") {
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, balance_cents INTEGER NOT NULL CHECK (balance_cents >= 0));
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      delta_cents INTEGER NOT NULL
    );
  `);

  const insertAccount = db.prepare("INSERT INTO accounts (id, balance_cents) VALUES (?, ?)");
  const getAccount = db.prepare("SELECT id, balance_cents FROM accounts WHERE id = ?");
  const adjust = db.prepare("UPDATE accounts SET balance_cents = balance_cents + @delta WHERE id = @id");
  const addEntry = db.prepare("INSERT INTO entries (account_id, delta_cents) VALUES (@id, @delta)");

  const account = (id: string): Account | undefined => {
    const row = getAccount.get(id);
    return row ? AccountRow.parse(row) : undefined;
  };

  // db.transaction wraps the function: it commits on return and rolls back if it throws.
  const transferTx = db.transaction((t: z.infer<typeof Transfer>) => {
    const from = account(t.from);
    if (!from || !account(t.to)) throw new Error("unknown account");
    if (from.balance_cents < t.cents) throw new InsufficientFunds(`${t.from} has ${from.balance_cents}`);
    adjust.run({ id: t.from, delta: -t.cents });
    addEntry.run({ id: t.from, delta: -t.cents });
    adjust.run({ id: t.to, delta: t.cents });
    addEntry.run({ id: t.to, delta: t.cents });
  });

  // Nested transactions become savepoints: one bad transfer in a batch can roll back the whole batch.
  const batchTx = db.transaction((items: unknown[]) => {
    for (const item of items) transferTx(Transfer.parse(item));
    return items.length;
  });

  return {
    db,
    open: (id: string, cents = 0) => insertAccount.run(id, cents),
    account,
    transfer: (input: unknown) => transferTx(Transfer.parse(input)),
    batch: (items: unknown[]) => batchTx(items),
    entryCount: () => (db.prepare("SELECT COUNT(*) AS n FROM entries").get() as { n: number }).n,
    close: () => db.close(),
  };
}
