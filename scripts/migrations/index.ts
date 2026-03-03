export {
  runMysqlMigrations,
  runMysqlMigrationFile,
  rollbackMysqlMigrations,
  rollbackMysqlMigrationFile,
} from './mysql/index.ts';

export {
  runMongoMigrations,
  runMongoMigrationFile,
  rollbackMongoMigrations,
  rollbackMongoMigrationFile,
} from './mongo/index.ts';

export {
  runSqliteMigrations,
  runSqliteMigrationFile,
  rollbackSqliteMigrations,
  rollbackSqliteMigrationFile,
} from './sqlite/index.ts';

export {
  runPgMigrations,
  runPgMigrationFile,
  rollbackPgMigrations,
  rollbackPgMigrationFile,
} from './pg/index.ts';

export { createMigrationFile } from './utils.ts';

import { runMysqlMigrations, rollbackMysqlMigrations } from './mysql/index.ts';
import { runMongoMigrations, rollbackMongoMigrations } from './mongo/index.ts';
import { runSqliteMigrations, rollbackSqliteMigrations } from './sqlite/index.ts';
import { runPgMigrations, rollbackPgMigrations } from './pg/index.ts';
import { closeMysqlPool } from '../../src/database/mysql.connection.ts';
import { disconnectMongo } from '../../src/database/mongo.connection.ts';
import { closeSqliteConnection } from '../../src/database/sqlite.connection.ts';
import { closePgConnection } from '../../src/database/pg.connection.ts';

export const runAllMigrations = async (): Promise<void> => {
  console.log('Running all migrations...\n');

  try {
    await runMysqlMigrations();
    console.log('');
  } catch (error) {
    console.error('MySQL migrations failed:', error);
  }

  try {
    await runMongoMigrations();
    console.log('');
  } catch (error) {
    console.error('MongoDB migrations failed:', error);
  }

  try {
    await runPgMigrations();
    console.log('');
  } catch (error) {
    console.error('PostgreSQL migrations failed:', error);
  }

  try {
    await runSqliteMigrations();
    console.log('');
  } catch (error) {
    console.error('SQLite migrations failed:', error);
  }

  await closeMysqlPool();
  await disconnectMongo();
  await closePgConnection();
  closeSqliteConnection();

  console.log('All migrations complete!');
};

export const rollbackAllMigrations = async (steps: number = 1): Promise<void> => {
  console.log(`Rolling back ${steps} migration(s) for all databases...\n`);

  try {
    await rollbackMysqlMigrations(steps);
    console.log('');
  } catch (error) {
    console.error('MySQL rollback failed:', error);
  }

  try {
    await rollbackMongoMigrations(steps);
    console.log('');
  } catch (error) {
    console.error('MongoDB rollback failed:', error);
  }

  try {
    await rollbackPgMigrations(steps);
    console.log('');
  } catch (error) {
    console.error('PostgreSQL rollback failed:', error);
  }

  try {
    await rollbackSqliteMigrations(steps);
    console.log('');
  } catch (error) {
    console.error('SQLite rollback failed:', error);
  }

  console.log('All rollbacks complete!');
};
