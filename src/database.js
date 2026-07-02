const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../loans.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS loans (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower   TEXT    NOT NULL,
    amount     REAL    NOT NULL,
    loan_date  TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS history (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id          INTEGER NOT NULL,
    borrower_before  TEXT    NOT NULL,
    amount_before    REAL    NOT NULL,
    loan_date_before TEXT    NOT NULL,
    changed_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    change_note      TEXT
  );
`);

module.exports = db;