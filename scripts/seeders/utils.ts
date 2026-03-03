import * as fs from 'fs';
import * as path from 'path';
const getStub = (stubName: string, replacements: Record<string, string>) => {
  const stubPath = path.join('./scripts/stubs', stubName);
  if (!fs.existsSync(stubPath)) {
    throw new Error(`Stub not found: ${stubPath}`);
  }
  let content = fs.readFileSync(stubPath, 'utf-8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return content;
};

export const createSeederFile = (type: 'mysql' | 'mongo' | 'pg' | 'sqlite', name: string): string => {
  const fileName = name.endsWith('.ts') ? name : `${name}.ts`;
  const dir = `./scripts/seeders/${type}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const template = getStub(`seeder/${type}.stub`, {
    NAME: name
  });

  const filePath = path.join(dir, fileName);
  if (fs.existsSync(filePath)) {
    throw new Error(`Seeder already exists: ${filePath}`);
  }

  fs.writeFileSync(filePath, template);
  return filePath;
};
