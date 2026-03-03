import {
  runAllMigrations,
  rollbackAllMigrations,
  runMysqlMigrations,
  runMongoMigrations,
  runSqliteMigrations,
  runPgMigrations,
  rollbackMysqlMigrations,
  rollbackMongoMigrations,
  rollbackSqliteMigrations,
  rollbackPgMigrations,
  runMysqlMigrationFile,
  runMongoMigrationFile,
  runSqliteMigrationFile,
  runPgMigrationFile,
  rollbackMysqlMigrationFile,
  rollbackMongoMigrationFile,
  rollbackSqliteMigrationFile,
  rollbackPgMigrationFile,
  createMigrationFile,
} from './migrations/index.ts';
import { closeMysqlPool } from '../src/database/mysql.connection.ts';
import { disconnectMongo } from '../src/database/mongo.connection.ts';
import { closePgConnection } from '../src/database/pg.connection.ts';
import { closeSqliteConnection } from '../src/database/sqlite.connection.ts';
import * as fs from 'fs';

const args = process.argv.slice(2);
const knownCommands = ['up', 'down', 'create', 'status', 'rollback', 'help'];
const targets = ['mysql', 'mongo', 'pg', 'sqlite', 'all'];

let command = 'up';
let target = 'all';
let fileName: string | undefined = undefined;

if (args.length > 0) {
  if (knownCommands.includes(args[0])) {
    command = args[0];
    target = args[1] || 'all';
    fileName = args[2];
  } else if (targets.includes(args[0])) {
    command = 'up';
    target = args[0];
    fileName = args[1];
  } else {
    // If first arg isn't a command or target, assume it's help or error
    command = 'help';
  }
}

const steps = fileName ? parseInt(fileName, 10) : 1;

const printUsage = () => {
  console.log(`
Migration CLI (Laravel-style)

Usage:
  bun run migrate [command] [target] [options]

Commands:
  up [target]              Run all pending migrations (Default)
  down [target] [steps]    Rollback migrations (default: 1 step)
  create <target> <name>   Create a new migration file (target: mysql, mongo, pg, sqlite)
  status [target]          Show migration status
  rollback [target]        Alias for 'down'
  
Note: You can also run a specific file directly:
  bun run migrate <target> <file_name>

Targets:
  all (default), mysql, mongo, pg, sqlite

Examples:
  bun run migrate                        Run all pending migrations
  bun run migrate mysql                  Run MySQL migrations only
  bun run migrate down                   Rollback 1 step for all DBs
  bun run migrate pg <file_name>         Run specific PG migration
  bun run migrate create pg add_users_table
`);
};

const run = async () => {
  // Shortcut for 'rollback' to 'down'
  if (command === 'rollback') command = 'down';

  switch (command) {
    case 'up':
      // Check if 'target' is actually a database type and 'fileName' is a specific file
      if (['mysql', 'mongo', 'pg', 'sqlite'].includes(target) && fileName && isNaN(parseInt(fileName, 10))) {
        console.log(`Running specific migration file: ${fileName}`);
        if (target === 'mysql') await runMysqlMigrationFile(fileName);
        if (target === 'mongo') await runMongoMigrationFile(fileName);
        if (target === 'pg') await runPgMigrationFile(fileName);
        if (target === 'sqlite') await runSqliteMigrationFile(fileName);
        break;
      }

      if (target === 'mysql') {
        await runMysqlMigrations();
        await closeMysqlPool();
      } else if (target === 'mongo') {
        await runMongoMigrations();
        await disconnectMongo();
      } else if (target === 'pg') {
        await runPgMigrations();
        await closePgConnection();
      } else if (target === 'sqlite') {
        await runSqliteMigrations();
        closeSqliteConnection();
      } else {
        await runAllMigrations();
      }
      break;

    case 'down':
      if (target === 'mysql') {
        await rollbackMysqlMigrations(steps);
      } else if (target === 'mongo') {
        await rollbackMongoMigrations(steps);
      } else if (target === 'pg') {
        await rollbackPgMigrations(steps);
      } else if (target === 'sqlite') {
        await rollbackSqliteMigrations(steps);
      } else {
        await rollbackAllMigrations(steps);
      }
      break;

    case 'create':
      if (target === 'all' || !fileName) {
        console.error('Error: target and name are required');
        printUsage();
        process.exit(1);
      }
      if (!['mysql', 'mongo', 'pg', 'sqlite'].includes(target)) {
        console.error('Error: target must be mysql, mongo, pg, or sqlite');
        process.exit(1);
      }
      const filePath = createMigrationFile(target as any, fileName);
      console.log(`Created migration: ${filePath}`);
      break;

    case 'status':
      console.log('Status command coming soon...');
      break;

    case 'help':
      printUsage();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
