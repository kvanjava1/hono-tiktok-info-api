import { getPgSql } from '../../../src/database/pg.connection.ts';
import { logger } from '../../../src/utils/logger.ts';
import type postgres from 'postgres';

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

export interface PgMigration {
    name: string;
    up: (sql: postgres.Sql) => Promise<void>;
    down: (sql: postgres.Sql) => Promise<void>;
}

export const createMigrationsTable = async (): Promise<void> => {
    const sql = getPgSql();
    await sql.unsafe(CREATE_MIGRATIONS_TABLE);
};

export const getExecutedMigrations = async (): Promise<string[]> => {
    const sql = getPgSql();
    const rows = await sql<{ name: string }[]>`SELECT name FROM migrations ORDER BY id`;
    return rows.map((row) => row.name);
};

export const markMigrationAsExecuted = async (name: string): Promise<void> => {
    const sql = getPgSql();
    await sql`INSERT INTO migrations (name) VALUES (${name})`;
};

export const unmarkMigrationAsExecuted = async (name: string): Promise<void> => {
    const sql = getPgSql();
    await sql`DELETE FROM migrations WHERE name = ${name}`;
};
