# Migration Guide (Laravel-style)

## Overview

This project uses a flat, powerful migration system inspired by Laravel. It supports **MySQL**, **MongoDB**, **PostgreSQL**, and **SQLite** simultaneously.

## Directory Structure

```text
scripts/migrations/
├── mysql/files/    # MySQL .ts migration files
├── mongo/files/    # MongoDB .ts migration files
├── pg/files/       # PostgreSQL .ts migration files
└── sqlite/files/   # SQLite .ts migration files
```

---

## Available Commands

This project uses explicit environment-based commands for safety.

| Action | Dev Command (`.env.dev`) | Prod Command (`.env.prod`) |
| :--- | :--- | :--- |
| **Migrate All** | `bun run migrate:dev` | `bun run migrate:prod` |
| **Migrate MySQL** | `bun run migrate:dev:mysql` | `bun run migrate:prod:mysql` |
| **Migrate MongoDB** | `bun run migrate:dev:mongo` | `bun run migrate:prod:mongo` |
| **Migrate PostgreSQL**| `bun run migrate:dev:pg` | `bun run migrate:prod:pg` |
| **Migrate SQLite** | `bun run migrate:dev:sqlite` | `bun run migrate:prod:sqlite` |
| **Rollback** | `bun run migrate:dev:down` | (Not recommended) |
| **Create New** | `bun run make migration <target> <name>` | N/A |

---

## Usage Examples

### 1. Running Migrations
To run all pending migrations for every database:
```bash
bun run migrate
```

To run migrations only for MySQL:
```bash
bun run migrate mysql
```

### 2. Running a Specific File
If you want to run one specific migration file:
```bash
bun run migrate mysql 20260218_create_users_table
```

### 3. Rolling Back
To rollback the last "step" (batch) of migrations across all databases:
```bash
bun run migrate rollback
```

To rollback the last step for just one database:
```bash
bun run migrate rollback mysql
```

### 4. Creating New Migrations
This works like Laravel's `make:migration`. It will generate a timestamped file with a template.
```bash
bun run migrate create mysql add_phone_to_users
```
Available targets: `mysql`, `mongo`, `pg`, `sqlite`.

---

## Migration File Template

When you create a migration, it looks like this:

### PostgreSQL Example
```typescript
import type postgres from 'postgres';

export const name = '20260218_add_phone_to_users';

export const up = async (sql: postgres.Sql): Promise<void> => {
  await sql`
    ALTER TABLE users ADD COLUMN phone VARCHAR(20)
  `;
};

export const down = async (sql: postgres.Sql): Promise<void> => {
  await sql`
    ALTER TABLE users DROP COLUMN phone
  `;
};
```

### MySQL Example
```typescript
import type { Pool } from 'mysql2/promise';

export const up = async (pool: Pool): Promise<void> => {
  await pool.execute(`
    ALTER TABLE users ADD COLUMN phone VARCHAR(20)
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.execute(`
    ALTER TABLE users DROP COLUMN phone
  `);
};
```

---

## Best Practices

1.  **Always implement `down()`**: Ensure your migrations are reversible so `rollback` works.
2.  **No manual DB changes**: Always use migrations to change your schema so your team stays in sync.
3.  **Run before Seeding**: Tables must exist before you can seed data into them.
