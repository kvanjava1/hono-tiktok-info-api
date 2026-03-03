import { seedAll, runSeederFile } from './seeders/index.ts';
import { createSeederFile } from './seeders/utils.ts';

const args = process.argv.slice(2);
const knownCommands = ['create', 'help'];
const targets = ['mysql', 'mongo', 'pg', 'sqlite', 'all'];

let command = 'run';
let target = 'all';
let fileName: string | undefined = undefined;

if (args.length > 0) {
  const arg0 = args[0] || '';
  if (knownCommands.includes(arg0)) {
    command = arg0;
    target = args[1] || 'all';
    fileName = args[2];
  } else if (targets.includes(arg0)) {
    command = 'run';
    target = arg0;
    fileName = args[1];
  } else {
    command = 'help';
  }
}

const printUsage = () => {
  console.log(`
Seeder CLI (Laravel-style)

Usage:
  bun run seed [target] [options]
  bun run seed create <target> <name>

Commands:
  (default) [target]       Run all seeders (or for specific target)
  create <target> <name>   Create a new seeder file
  
Note: You can also run a specific file directly:
  bun run seed <target> <file_name>

Targets:
  all (default), mysql, mongo, pg, sqlite

Examples:
  bun run seed                          Run all seeders
  bun run seed mysql                    Run MySQL seeders only
  bun run seed pg UserSeeder            Run specific PostgreSQL seeder
  bun run seed create pg UserSeeder     Create a new PostgreSQL seeder
`);
};

const run = async () => {
  switch (command) {
    case 'run':
      if (['mysql', 'mongo', 'pg', 'sqlite'].includes(target) && fileName) {
        console.log(`Running specific seeder: ${target}/${fileName}`);
        await runSeederFile(target as any, fileName);
        break;
      }

      if (target === 'all') {
        await seedAll();
      } else {
        // Run all seeders for specific target
        const dir = `./scripts/seeders/${target}`;
        if (require('fs').existsSync(dir)) {
          const files = require('fs').readdirSync(dir).filter((f: string) => f.endsWith('.ts'));
          for (const file of files) {
            await runSeederFile(target as any, file.replace('.ts', ''));
          }
        } else {
          console.log(`No seeders found for ${target}`);
        }
      }
      break;

    case 'create':
      if (target === 'all' || !fileName) {
        console.error('Error: target and name are required');
        printUsage();
        process.exit(1);
      }
      const filePath = createSeederFile(target as any, fileName);
      console.log(`Created seeder: ${filePath}`);
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
  console.error('Seeding failed:', error);
  process.exit(1);
});
