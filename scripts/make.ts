import { createMigrationFile } from './migrations/utils.ts';
import { createSeederFile } from './seeders/utils.ts';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const type = args[0]; // migration, seeder, controller, service, repository, schema
const target = args[1]; // mysql, mongo, pg, sqlite
const name = args[2];

const printUsage = () => {
  console.log(`
Make CLI (Laravel-style)

Usage:
  bun run make <type> <target> <name>

Available Types:
  migration      Create a new migration file
  seeder         Create a new seeder file
  controller     Create a new controller (handler)
  service        Create a new service (business logic)
  repository     Create a new repository (raw queries)
  schema         Create a new Zod schema/type
  job            Create a new background job handler

Targets:
  mysql, mongo, pg, sqlite

Examples:
  bun run make migration pg add_users_table
  bun run make seeder pg UserSeeder
  bun run make controller User
  bun run make service pg User
  bun run make repository pg User
  bun run make schema User
  bun run make job SendEmail
`);
};

if (!type || !['migration', 'seeder', 'controller', 'service', 'repository', 'schema', 'job', 'help'].includes(type) || type === 'help') {
  printUsage();
  process.exit(0);
}

const run = async () => {
  try {
    switch (type) {
      case 'migration':
        if (!target || !name) throw new Error('Usage: bun run make migration <target> <name>');
        const mPath = createMigrationFile(target as any, name);
        console.log(`Created migration: ${mPath}`);
        break;

      case 'seeder':
        if (!target || !name) throw new Error('Usage: bun run make seeder <target> <name>');
        const sPath = createSeederFile(target as any, name);
        console.log(`Created seeder: ${sPath}`);
        break;

      case 'controller':
        if (!target) throw new Error('Usage: bun run make controller <name>');
        // target is name here
        const cPath = createControllerFile(target);
        console.log(`Created controller: ${cPath}`);
        break;

      case 'service':
        if (!target || !name) throw new Error('Usage: bun run make service <target> <name>');
        const svPath = createServiceFile(target as any, name);
        console.log(`Created service: ${svPath}`);
        break;

      case 'repository':
        if (!target || !name) throw new Error('Usage: bun run make repository <target> <name>');
        const rPath = createRepositoryFile(target as any, name);
        console.log(`Created repository: ${rPath}`);
        break;

      case 'schema':
        if (!target) throw new Error('Usage: bun run make schema <name>');
        // target is name here
        const scPath = createSchemaFile(target);
        console.log(`Created schema: ${scPath}`);
        break;

      case 'job':
        if (!target) throw new Error('Usage: bun run make job <name>');
        // target is name here
        const jPath = createJobFile(target);
        console.log(`Created job: ${jPath}`);
        break;
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// --- Helpers ---

function getStub(stubName: string, replacements: Record<string, string>) {
  const stubPath = path.join('./scripts/stubs', stubName);
  if (!fs.existsSync(stubPath)) {
    throw new Error(`Stub not found: ${stubPath}`);
  }
  let content = fs.readFileSync(stubPath, 'utf-8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- Generators ---

function createControllerFile(name: string) {
  const fileName = name.toLowerCase().endsWith('.controller') ? name : `${name}.controller`;
  const filePath = `./src/controllers/${fileName}.ts`;

  const template = getStub('controller.stub', {
    NAME: name,
    LOWER_NAME: name.toLowerCase()
  });

  ensureDir('./src/controllers');
  fs.writeFileSync(filePath, template);
  return filePath;
}

function createServiceFile(type: 'mysql' | 'mongo' | 'pg' | 'sqlite', name: string) {
  const fileName = name.toLowerCase().endsWith('.service') ? name : `${name}.service`;
  const filePath = `./src/services/${type}/${fileName}.ts`;

  const template = getStub('service.stub', {
    NAME: name,
    LOWER_NAME: name.toLowerCase(),
    TYPE: type
  });

  ensureDir(`./src/services/${type}`);
  fs.writeFileSync(filePath, template);
  return filePath;
}

function createRepositoryFile(type: 'mysql' | 'mongo' | 'pg' | 'sqlite', name: string) {
  const fileName = name.toLowerCase().endsWith('.repository') ? name : `${name}.repository`;
  const filePath = `./src/repositories/${type}/${fileName}.ts`;

  const template = getStub(`repository/${type}.stub`, {
    NAME: name,
    LOWER_NAME: name.toLowerCase()
  });

  ensureDir(`./src/repositories/${type}`);
  fs.writeFileSync(filePath, template);
  return filePath;
}

function createSchemaFile(name: string) {
  const fileName = name.toLowerCase().endsWith('.schema') ? name : `${name}.schema`;
  const filePath = `./src/schemas/${fileName}.ts`;

  const template = getStub('schema.stub', {
    NAME: name,
    LOWER_NAME: name.toLowerCase()
  });

  ensureDir('./src/schemas');
  fs.writeFileSync(filePath, template);
  return filePath;
}

function createJobFile(name: string) {
  const fileName = name.toLowerCase().endsWith('.job') ? name : `${name}.job`;
  const filePath = `./src/jobs/${fileName}.ts`;

  const template = getStub('job.stub', {
    NAME: name,
    LOWER_NAME: name.toLowerCase()
  });

  ensureDir('./src/jobs');
  fs.writeFileSync(filePath, template);
  return filePath;
}

run();
