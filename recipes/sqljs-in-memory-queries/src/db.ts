import initSqlJs, { type Database } from "sql.js";

export async function openNotesDb(existing?: Uint8Array) {
  const SQL = await initSqlJs();
  const db: Database = existing ? new SQL.Database(existing) : new SQL.Database();
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL
  )`);
  return {
    add(title: string, body: string) {
      db.run("INSERT INTO notes (title, body) VALUES (?, ?)", [title, body]);
      const row = db.exec("SELECT last_insert_rowid() AS id")[0];
      return Number(row.values[0][0]);
    },
    list() {
      const result = db.exec("SELECT id, title, body FROM notes ORDER BY id");
      if (!result.length) return [] as { id: number; title: string; body: string }[];
      return result[0].values.map(([id, title, body]) => ({
        id: Number(id),
        title: String(title),
        body: String(body),
      }));
    },
    find(id: number) {
      const stmt = db.prepare("SELECT id, title, body FROM notes WHERE id = ?");
      stmt.bind([id]);
      if (!stmt.step()) {
        stmt.free();
        return null;
      }
      const row = stmt.getAsObject() as { id: number; title: string; body: string };
      stmt.free();
      return row;
    },
    export() {
      return db.export();
    },
    close() {
      db.close();
    },
  };
}
