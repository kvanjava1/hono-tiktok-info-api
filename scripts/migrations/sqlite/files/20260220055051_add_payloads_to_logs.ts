import type { SqliteMigration } from '../runner.ts';
import type { Database } from 'bun:sqlite';

export const name = '20260220055051_add_payloads_to_logs';

export const up = async (db: Database): Promise<void> => {
  db.run('ALTER TABLE api_usage_logs ADD COLUMN request_body TEXT');
  db.run('ALTER TABLE api_usage_logs ADD COLUMN response_body TEXT');
};

export const down = async (db: Database): Promise<void> => {
  // SQLite 3.35.0+ supports DROP COLUMN
  try {
    db.run('ALTER TABLE api_usage_logs DROP COLUMN request_body');
    db.run('ALTER TABLE api_usage_logs DROP COLUMN response_body');
  } catch (e) {
    console.warn('Rollback failed: SQLite version may not support DROP COLUMN. You might need to manually recreate the table.');
  }
};
