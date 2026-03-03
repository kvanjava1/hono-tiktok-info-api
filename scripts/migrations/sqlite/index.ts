import { createSqliteConnection, closeSqliteConnection, getSqliteDb } from '../../../src/database/sqlite.connection.ts';
import { createMigrationsTable, getExecutedMigrations, markMigrationAsExecuted, unmarkMigrationAsExecuted } from './runner.ts';
import { logger } from '../../../src/utils/logger.ts';
import * as fs from 'fs';
import * as path from 'path';
import type { SqliteMigration } from './runner.ts';

const MIGRATIONS_DIR = './scripts/migrations/sqlite/files';

export const runSqliteMigrations = async (): Promise<void> => {
  logger.info('Running SQLite migrations...');

  try {
    createSqliteConnection();
    createMigrationsTable();
    const executed = getExecutedMigrations();

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
      logger.info('Created migrations directory');
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.ts'))
      .sort();

    const db = getSqliteDb();
    let ranCount = 0;

    for (const file of files) {
      const migrationName = file.replace('.ts', '');

      if (executed.includes(migrationName)) {
        logger.debug(`Skipping ${migrationName} (already executed)`);
        continue;
      }

      logger.info(`Running migration: ${migrationName}`);

      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const migration: SqliteMigration = await import(migrationPath);

      await migration.up(db);
      markMigrationAsExecuted(migrationName);

      logger.info(`Completed: ${migrationName}`);
      ranCount++;
    }

    if (ranCount === 0) {
      logger.info('No new migrations to run');
    } else {
      logger.info(`Ran ${ranCount} migration(s)`);
    }
  } catch (error) {
    logger.error('SQLite migrations failed', error);
    throw error;
  }
};

export const runSqliteMigrationFile = async (fileName: string): Promise<void> => {
  logger.info(`Running specific SQLite migration: ${fileName}`);

  try {
    createSqliteConnection();
    createMigrationsTable();
    const executed = getExecutedMigrations();
    const migrationName = fileName.replace('.ts', '');

    if (executed.includes(migrationName)) {
      logger.info(`Migration ${migrationName} already executed`);
      closeSqliteConnection();
      return;
    }

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const db = getSqliteDb();
    const migration: SqliteMigration = await import(migrationPath);

    await migration.up(db);
    markMigrationAsExecuted(migrationName);

    logger.info(`Completed: ${migrationName}`);
    closeSqliteConnection();
  } catch (error) {
    logger.error('SQLite migration failed', error);
    throw error;
  }
};

export const rollbackSqliteMigrations = async (steps: number = 1): Promise<void> => {
  logger.info(`Rolling back ${steps} SQLite migration(s)...`);

  try {
    createSqliteConnection();
    createMigrationsTable();
    const executed = getExecutedMigrations();

    if (executed.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const toRollback = executed.slice(-steps).reverse();
    const db = getSqliteDb();

    for (const migrationName of toRollback) {
      logger.info(`Rolling back: ${migrationName}`);

      const migrationPath = path.join(MIGRATIONS_DIR, `${migrationName}.ts`);
      const migration: SqliteMigration = await import(migrationPath);

      await migration.down(db);
      unmarkMigrationAsExecuted(migrationName);

      logger.info(`Rolled back: ${migrationName}`);
    }

    closeSqliteConnection();
  } catch (error) {
    logger.error('SQLite rollback failed', error);
    throw error;
  }
};

export const rollbackSqliteMigrationFile = async (fileName: string): Promise<void> => {
  logger.info(`Rolling back specific SQLite migration: ${fileName}`);

  try {
    createSqliteConnection();
    createMigrationsTable();
    const migrationName = fileName.replace('.ts', '');

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const db = getSqliteDb();
    const migration: SqliteMigration = await import(migrationPath);

    await migration.down(db);
    unmarkMigrationAsExecuted(migrationName);

    logger.info(`Rolled back: ${migrationName}`);
    closeSqliteConnection();
  } catch (error) {
    logger.error('SQLite rollback failed', error);
    throw error;
  }
};
