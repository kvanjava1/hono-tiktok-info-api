import { getSqliteDb } from '../../../src/database/sqlite.connection.ts';
import { logger } from '../../../src/utils/logger.ts';

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    executed_at TEXT DEFAULT (datetime('now'))
  )
`;

export interface SqliteMigration {
  name: string;
  up: (db: ReturnType<typeof getSqliteDb>) => Promise<void>;
  down: (db: ReturnType<typeof getSqliteDb>) => Promise<void>;
}

export const createMigrationsTable = (): void => {
  const db = getSqliteDb();
  db.run(CREATE_MIGRATIONS_TABLE);
};

export const getExecutedMigrations = (): string[] => {
  const db = getSqliteDb();
  const rows = db.query<{ name: string }, []>('SELECT name FROM migrations ORDER BY id').all();
  return rows.map((row) => row.name);
};

export const markMigrationAsExecuted = (name: string): void => {
  const db = getSqliteDb();
  db.run('INSERT INTO migrations (name) VALUES (?)', [name]);
};

export const unmarkMigrationAsExecuted = (name: string): void => {
  const db = getSqliteDb();
  db.run('DELETE FROM migrations WHERE name = ?', [name]);
};
