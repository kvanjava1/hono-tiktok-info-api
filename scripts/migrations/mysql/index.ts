import { getMysqlPool, closeMysqlPool } from '../../../src/database/mysql.connection.ts';
import { createMigrationsTable, getExecutedMigrations, markMigrationAsExecuted, unmarkMigrationAsExecuted } from './runner.ts';
import { logger } from '../../../src/utils/logger.ts';
import * as fs from 'fs';
import * as path from 'path';
import type { MySqlMigration } from './runner.ts';

const MIGRATIONS_DIR = './scripts/migrations/mysql/files';

export const runMysqlMigrations = async (): Promise<void> => {
  logger.info('Running MySQL migrations...');

  try {
    await createMigrationsTable();
    const executed = await getExecutedMigrations();

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
      logger.info('Created migrations directory');
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.ts'))
      .sort();

    const pool = getMysqlPool();
    let ranCount = 0;

    for (const file of files) {
      const migrationName = file.replace('.ts', '');

      if (executed.includes(migrationName)) {
        logger.debug(`Skipping ${migrationName} (already executed)`);
        continue;
      }

      logger.info(`Running migration: ${migrationName}`);

      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const migration: MySqlMigration = await import(migrationPath);

      await migration.up(pool);
      await markMigrationAsExecuted(migrationName);

      logger.info(`Completed: ${migrationName}`);
      ranCount++;
    }

    if (ranCount === 0) {
      logger.info('No new migrations to run');
    } else {
      logger.info(`Ran ${ranCount} migration(s)`);
    }
  } catch (error) {
    logger.error('MySQL migrations failed', error);
    throw error;
  }
};

export const runMysqlMigrationFile = async (fileName: string): Promise<void> => {
  logger.info(`Running specific MySQL migration: ${fileName}`);

  try {
    await createMigrationsTable();
    const executed = await getExecutedMigrations();
    const migrationName = fileName.replace('.ts', '');

    if (executed.includes(migrationName)) {
      logger.info(`Migration ${migrationName} already executed`);
      return;
    }

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const pool = getMysqlPool();
    const migration: MySqlMigration = await import(migrationPath);

    await migration.up(pool);
    await markMigrationAsExecuted(migrationName);

    logger.info(`Completed: ${migrationName}`);
    await closeMysqlPool();
  } catch (error) {
    logger.error('MySQL migration failed', error);
    throw error;
  }
};

export const rollbackMysqlMigrations = async (steps: number = 1): Promise<void> => {
  logger.info(`Rolling back ${steps} MySQL migration(s)...`);

  try {
    await createMigrationsTable();
    const executed = await getExecutedMigrations();

    if (executed.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const toRollback = executed.slice(-steps).reverse();
    const pool = getMysqlPool();

    for (const migrationName of toRollback) {
      logger.info(`Rolling back: ${migrationName}`);

      const migrationPath = path.join(MIGRATIONS_DIR, `${migrationName}.ts`);
      const migration: MySqlMigration = await import(migrationPath);

      await migration.down(pool);
      await unmarkMigrationAsExecuted(migrationName);

      logger.info(`Rolled back: ${migrationName}`);
    }

    await closeMysqlPool();
  } catch (error) {
    logger.error('MySQL rollback failed', error);
    throw error;
  }
};

export const rollbackMysqlMigrationFile = async (fileName: string): Promise<void> => {
  logger.info(`Rolling back specific MySQL migration: ${fileName}`);

  try {
    await createMigrationsTable();
    const migrationName = fileName.replace('.ts', '');

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const pool = getMysqlPool();
    const migration: MySqlMigration = await import(migrationPath);

    await migration.down(pool);
    await unmarkMigrationAsExecuted(migrationName);

    logger.info(`Rolled back: ${migrationName}`);
    await closeMysqlPool();
  } catch (error) {
    logger.error('MySQL rollback failed', error);
    throw error;
  }
};
