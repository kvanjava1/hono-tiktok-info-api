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

export const createMigrationFile = (type: 'mysql' | 'mongo' | 'pg' | 'sqlite', name: string): string => {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const fileName = `${timestamp}_${name}`;
  const dir = `./scripts/migrations/${type}/files`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const template = getStub(`migration/${type}.stub`, {
    FILENAME: fileName
  });

  const filePath = path.join(dir, `${fileName}.ts`);
  fs.writeFileSync(filePath, template);

  return filePath;
};
