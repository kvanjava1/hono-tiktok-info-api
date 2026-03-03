import { connectMongo, disconnectMongo, getMongoDb } from '../../../src/database/mongo.connection.ts';
import { getExecutedMigrations, markMigrationAsExecuted, unmarkMigrationAsExecuted } from './runner.ts';
import { logger } from '../../../src/utils/logger.ts';
import * as fs from 'fs';
import * as path from 'path';
import type { MongoMigration } from './runner.ts';

const MIGRATIONS_DIR = './scripts/migrations/mongo/files';

export const runMongoMigrations = async (): Promise<void> => {
  logger.info('Running MongoDB migrations...');

  try {
    const db = await connectMongo();
    const executed = await getExecutedMigrations();

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
      logger.info('Created migrations directory');
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.ts'))
      .sort();

    let ranCount = 0;

    for (const file of files) {
      const migrationName = file.replace('.ts', '');

      if (executed.includes(migrationName)) {
        logger.debug(`Skipping ${migrationName} (already executed)`);
        continue;
      }

      logger.info(`Running migration: ${migrationName}`);

      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const migration: MongoMigration = await import(migrationPath);

      await migration.up(db);
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
    logger.error('MongoDB migrations failed', error);
    throw error;
  }
};

export const runMongoMigrationFile = async (fileName: string): Promise<void> => {
  logger.info(`Running specific MongoDB migration: ${fileName}`);

  try {
    const db = await connectMongo();
    const executed = await getExecutedMigrations();
    const migrationName = fileName.replace('.ts', '');

    if (executed.includes(migrationName)) {
      logger.info(`Migration ${migrationName} already executed`);
      await disconnectMongo();
      return;
    }

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration: MongoMigration = await import(migrationPath);

    await migration.up(db);
    await markMigrationAsExecuted(migrationName);

    logger.info(`Completed: ${migrationName}`);
    await disconnectMongo();
  } catch (error) {
    logger.error('MongoDB migration failed', error);
    throw error;
  }
};

export const rollbackMongoMigrations = async (steps: number = 1): Promise<void> => {
  logger.info(`Rolling back ${steps} MongoDB migration(s)...`);

  try {
    const db = await connectMongo();
    const executed = await getExecutedMigrations();

    if (executed.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const toRollback = executed.slice(-steps).reverse();

    for (const migrationName of toRollback) {
      logger.info(`Rolling back: ${migrationName}`);

      const migrationPath = path.join(MIGRATIONS_DIR, `${migrationName}.ts`);
      const migration: MongoMigration = await import(migrationPath);

      await migration.down(db);
      await unmarkMigrationAsExecuted(migrationName);

      logger.info(`Rolled back: ${migrationName}`);
    }
  } catch (error) {
    logger.error('MongoDB rollback failed', error);
    throw error;
  } finally {
    await disconnectMongo();
  }
};

export const rollbackMongoMigrationFile = async (fileName: string): Promise<void> => {
  logger.info(`Rolling back specific MongoDB migration: ${fileName}`);

  try {
    const db = await connectMongo();
    const migrationName = fileName.replace('.ts', '');

    const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migration: MongoMigration = await import(migrationPath);

    await migration.down(db);
    await unmarkMigrationAsExecuted(migrationName);

    logger.info(`Rolled back: ${migrationName}`);
  } catch (error) {
    logger.error('MongoDB rollback failed', error);
    throw error;
  } finally {
    await disconnectMongo();
  }
};
