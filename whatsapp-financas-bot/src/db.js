const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.FINANCAS_DB_PATH || path.join(__dirname, '..', 'data', 'financas.db');

const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'outros',
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid TEXT NOT NULL,
    name TEXT NOT NULL,
    target REAL NOT NULL,
    saved REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_day INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bill_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    paid_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(bill_id, year, month),
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_jid, created_at);
  CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_jid);
  CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_jid);
`);

function ensureUser(jid, name) {
  db.prepare(
    `INSERT INTO users (jid, name) VALUES (?, ?)
     ON CONFLICT(jid) DO UPDATE SET name = excluded.name WHERE excluded.name IS NOT NULL`
  ).run(jid, name || null);
}

module.exports = { db, ensureUser };
