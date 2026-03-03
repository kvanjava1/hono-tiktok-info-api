import * as fs from 'fs';
import * as path from 'path';

export const runSeederFile = async (type: 'mysql' | 'mongo' | 'pg' | 'sqlite', fileName: string): Promise<void> => {
  const seederPath = path.resolve(`./scripts/seeders/${type}/${fileName}.ts`);

  if (!fs.existsSync(seederPath)) {
    throw new Error(`Seeder file not found: ${seederPath}`);
  }

  const module = await import(seederPath);
  if (typeof module.seed !== 'function') {
    throw new Error(`Seeder file must export a 'seed' function: ${seederPath}`);
  }

  await module.seed();
};

export const seedAll = async (): Promise<void> => {
  console.log('Seeding all databases...\n');

  const targets: ('mysql' | 'mongo' | 'pg' | 'sqlite')[] = ['mysql', 'mongo', 'pg', 'sqlite'];

  for (const target of targets) {
    const dir = `./scripts/seeders/${target}`;
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
    for (const file of files) {
      console.log(`Running seeder: ${target}/${file}`);
      try {
        await runSeederFile(target, file.replace('.ts', ''));
      } catch (error) {
        console.error(`Seeder ${target}/${file} failed:`, error);
      }
    }
  }

  console.log('Seeding complete!');
};
