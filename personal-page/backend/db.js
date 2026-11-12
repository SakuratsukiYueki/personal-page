import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
mkdirSync(dataDir, { recursive: true });

// WAL 模式:讀寫並發效能較好
export const db = new DatabaseSync(join(dataDir, "messages.db"));
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    ip          TEXT,
    user_agent  TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_messages_created_at
    ON messages (created_at DESC);
`);

/** 新增一筆留言,回傳新建立的資料列 */
export function createMessage({ name, email, message, ip, userAgent }) {
  const stmt = db.prepare(
    `INSERT INTO messages (name, email, message, ip, user_agent)
     VALUES (?, ?, ?, ?, ?)`
  );
  const result = stmt.run(name, email, message, ip ?? null, userAgent ?? null);
  return getMessageById(result.lastInsertRowid);
}

/** 依 id 取單筆留言 */
export function getMessageById(id) {
  return db
    .prepare(
      `SELECT id, name, email, message, created_at
       FROM messages WHERE id = ?`
    )
    .get(id);
}

/** 取留言列表(新的在前),分頁 */
export function listMessages({ limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const rows = db
    .prepare(
      `SELECT id, name, email, message, created_at
       FROM messages
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`
    )
    .all(safeLimit, safeOffset);
  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM messages`)
    .get();
  return { total, limit: safeLimit, offset: safeOffset, rows };
}

/** 依 email 過濾(管理用) */
export function findMessagesByEmail(email) {
  return db
    .prepare(
      `SELECT id, name, email, message, created_at
       FROM messages WHERE email = ?
       ORDER BY created_at DESC`
    )
    .all(email);
}
