import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Prisma } from "./generated/prisma/client.ts";

export const createClient = (url = "file:./test.db") => new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
type Db = ReturnType<typeof createClient>;

export class EmailTaken extends Error {}

export async function openAccount(db: Db, email: string, deposit: number) {
  try {
    return await db.account.create({ data: { email, balance: deposit, entries: { create: [{ amount: deposit }] } }, include: { entries: true } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new EmailTaken(email);
    throw e;
  }
}

// Interactive transaction: any throw inside rolls back every write.
export function transfer(db: Db, from: string, to: string, amount: number) {
  return db.$transaction(async (tx) => {
    const src = await tx.account.update({ where: { email: from }, data: { balance: { decrement: amount }, entries: { create: { amount: -amount } } } });
    if (src.balance < 0) throw new Error("insufficient funds");
    await tx.account.update({ where: { email: to }, data: { balance: { increment: amount }, entries: { create: { amount } } } });
  });
}
