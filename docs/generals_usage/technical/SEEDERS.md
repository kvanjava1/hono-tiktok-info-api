# Seeder Guide (Laravel-style)

## Overview

This project includes a flexible seeding system that allows you to populate your databases (**MySQL**, **MongoDB**, **PostgreSQL**, **SQLite**) with sample or initial data.

## Directory Structure

```text
scripts/seeders/
├── mongo/          # MongoDB seeder files
├── mysql/          # MySQL seeder files
├── pg/             # PostgreSQL seeder files
├── sqlite/         # SQLite seeder files
├── index.ts        # Main seeder runner
└── utils.ts        # Seeder generator utility
```

---

## Available Commands

The Seeder CLI allows you to run all seeders, target specific databases, or run individual seeder files with environment-specific configurations.

| Action | Dev Command (`.env.dev`) | Prod Command (`.env.prod`) |
| :--- | :--- | :--- |
| **Seed All** | `bun run seed:dev` | `bun run seed:prod` |
| **Seed MySQL** | `bun run seed:dev:mysql` | `bun run seed:prod mysql` |
| **Seed MongoDB** | `bun run seed:dev:mongo` | `bun run seed:prod mongo` |
| **Seed PostgreSQL** | `bun run seed:dev:pg` | `bun run seed:prod pg` |
| **Seed SQLite** | `bun run seed:dev:sqlite` | `bun run seed:prod sqlite` |
| **Create New** | `bun run make seeder <target> <name>` | N/A |

---

## Usage Examples

### 1. Running Seeders
To run the default seeders for all databases:
```bash
bun run seed
```

To seed only MySQL:
```bash
bun run seed mysql
```

### 2. Running a Specific Seeder File
If you have multiple seeders (e.g., `ProductSeeder.ts`, `UserSeeder.ts`) and want to run only one:
```bash
bun run seed mysql ProductSeeder
```

### 3. Creating a New Seeder
This works like Laravel's `make:seeder`. It generates a clean template for you.
```bash
bun run seed create mysql CategorySeeder
```

---

## Seeder File Template

Each seeder file must export a `seed` function.

### PostgreSQL Example
```typescript
import { getPgSql } from '../../src/database/pg.connection.ts';
import { logger } from '../../src/utils/logger.ts';

export const seed = async (): Promise<void> => {
  logger.info('Seeding categories into PostgreSQL...');
  const sql = getPgSql();

  await sql`INSERT INTO categories (name) VALUES ('Electronics')`;
};
```

### MySQL Example
```typescript
import { getMysqlPool } from '../../src/database/mysql.connection.ts';
import { logger } from '../../src/utils/logger.ts';

export const seed = async (): Promise<void> => {
  logger.info('Seeding categories...');
  const pool = getMysqlPool();

  await pool.execute('INSERT INTO categories (name) VALUES (?)', ['Electronics']);
};
```

---

## Workflow

1.  **Generate a migration** to create the table.
2.  **Run the migration** (`bun run migrate`).
3.  **Generate a seeder** (`bun run seed create mysql MySeeder`).
4.  **Add your data** to the seeder file.
5.  **Run the seeder** (`bun run seed mysql MySeeder`).
