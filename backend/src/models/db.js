const path = require('path');
const Database = require('better-sqlite3');

/**
 * Resolve the database file location.
 * - During tests we use an in-memory database so each run starts clean.
 * - Otherwise we use the file configured via DATABASE_FILE (default: expense_tracker.db).
 */
function resolveDatabasePath() {
  if (process.env.NODE_ENV === 'test') {
    return ':memory:';
  }
  const fileName = process.env.DATABASE_FILE || 'expense_tracker.db';
  // Store the db file inside the backend folder regardless of cwd.
  return path.resolve(__dirname, '..', '..', fileName);
}

const db = new Database(resolveDatabasePath());

// Enable foreign key enforcement (off by default in SQLite).
db.pragma('foreign_keys = ON');
// Use WAL for better concurrency on a file-backed database.
if (process.env.NODE_ENV !== 'test') {
  db.pragma('journal_mode = WAL');
}

/**
 * Create all tables if they do not already exist.
 * This runs every time the app starts (safe + idempotent).
 */
function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      source TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      limit_amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, category, month, year)
    );

    CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, month, year);
  `);
}

runMigrations();

module.exports = db;
module.exports.runMigrations = runMigrations;
