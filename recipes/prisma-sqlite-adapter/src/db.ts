import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client.ts";

export function createClient(url = "file:./test.db") {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}
