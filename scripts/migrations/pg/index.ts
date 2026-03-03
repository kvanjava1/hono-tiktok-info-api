import { getPgSql, closePgConnection } from '../../../src/database/pg.connection.ts';
import { createMigrationsTable, getExecutedMigrations, markMigrationAsExecuted, unmarkMigrationAsExecuted } from './runner.ts';
import { logger } from '../../../src/utils/logger.ts';
import * as fs from 'fs';
import * as path from 'path';
import type { PgMigration } from './runner.ts';

const MIGRATIONS_DIR = './scripts/migrations/pg/files';

export const runPgMigrations = async (): Promise<void> => {
    logger.info('Running PostgreSQL migrations...');

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

        const sql = getPgSql();
        let ranCount = 0;

        for (const file of files) {
            const migrationName = file.replace('.ts', '');

            if (executed.includes(migrationName)) {
                logger.debug(`Skipping ${migrationName} (already executed)`);
                continue;
            }

            logger.info(`Running migration: ${migrationName}`);

            const migrationPath = path.join(MIGRATIONS_DIR, file);
            const migration: PgMigration = await import(migrationPath);

            await migration.up(sql);
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
        logger.error('PostgreSQL migrations failed', error);
        throw error;
    }
};

export const runPgMigrationFile = async (fileName: string): Promise<void> => {
    logger.info(`Running specific PostgreSQL migration: ${fileName}`);

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

        const sql = getPgSql();
        const migration: PgMigration = await import(migrationPath);

        await migration.up(sql);
        await markMigrationAsExecuted(migrationName);

        logger.info(`Completed: ${migrationName}`);
        await closePgConnection();
    } catch (error) {
        logger.error('PostgreSQL migration failed', error);
        throw error;
    }
};

export const rollbackPgMigrations = async (steps: number = 1): Promise<void> => {
    logger.info(`Rolling back ${steps} PostgreSQL migration(s)...`);

    try {
        await createMigrationsTable();
        const executed = await getExecutedMigrations();

        if (executed.length === 0) {
            logger.info('No migrations to rollback');
            return;
        }

        const toRollback = executed.slice(-steps).reverse();
        const sql = getPgSql();

        for (const migrationName of toRollback) {
            logger.info(`Rolling back: ${migrationName}`);

            const migrationPath = path.join(MIGRATIONS_DIR, `${migrationName}.ts`);
            const migration: PgMigration = await import(migrationPath);

            await migration.down(sql);
            await unmarkMigrationAsExecuted(migrationName);

            logger.info(`Rolled back: ${migrationName}`);
        }

        await closePgConnection();
    } catch (error) {
        logger.error('PostgreSQL rollback failed', error);
        throw error;
    }
};

export const rollbackPgMigrationFile = async (fileName: string): Promise<void> => {
    logger.info(`Rolling back specific PostgreSQL migration: ${fileName}`);

    try {
        await createMigrationsTable();
        const migrationName = fileName.replace('.ts', '');

        const migrationPath = path.join(MIGRATIONS_DIR, `${fileName}.ts`);

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const sql = getPgSql();
        const migration: PgMigration = await import(migrationPath);

        await migration.down(sql);
        await unmarkMigrationAsExecuted(migrationName);

        logger.info(`Rolled back: ${migrationName}`);
        await closePgConnection();
    } catch (error) {
        logger.error('PostgreSQL rollback failed', error);
        throw error;
    }
};
