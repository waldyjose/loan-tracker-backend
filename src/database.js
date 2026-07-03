const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS loans (
      id         SERIAL PRIMARY KEY,
      borrower   TEXT    NOT NULL,
      amount     NUMERIC NOT NULL,
      loan_date  TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS history (
      id               SERIAL PRIMARY KEY,
      loan_id          INTEGER NOT NULL,
      borrower_before  TEXT    NOT NULL,
      amount_before    NUMERIC NOT NULL,
      loan_date_before TEXT    NOT NULL,
      changed_at       TEXT    NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      change_note      TEXT
    );
  `);
};

initDB().catch(console.error);

module.exports = pool;