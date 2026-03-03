import { getMysqlPool } from '../../../src/database/mysql.connection.ts';
import { logger } from '../../../src/utils/logger.ts';

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

export interface MySqlMigration {
  name: string;
  up: (pool: ReturnType<typeof getMysqlPool>) => Promise<void>;
  down: (pool: ReturnType<typeof getMysqlPool>) => Promise<void>;
}

export const createMigrationsTable = async (): Promise<void> => {
  const pool = getMysqlPool();
  await pool.execute(CREATE_MIGRATIONS_TABLE);
};

export const getExecutedMigrations = async (): Promise<string[]> => {
  const pool = getMysqlPool();
  const [rows] = await pool.execute(
    'SELECT name FROM migrations ORDER BY id'
  );
  return (rows as any[]).map((row) => row.name);
};

export const markMigrationAsExecuted = async (name: string): Promise<void> => {
  const pool = getMysqlPool();
  await pool.execute('INSERT INTO migrations (name) VALUES (?)', [name]);
};

export const unmarkMigrationAsExecuted = async (name: string): Promise<void> => {
  const pool = getMysqlPool();
  await pool.execute('DELETE FROM migrations WHERE name = ?', [name]);
};
