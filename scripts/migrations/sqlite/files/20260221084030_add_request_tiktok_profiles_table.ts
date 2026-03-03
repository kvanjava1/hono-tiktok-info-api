import type { SqliteMigration } from '../runner.ts';
import type { Database } from 'bun:sqlite';

export const name = '20260221084030_add_request_tiktok_profiles_table';

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS request_tiktok_profiles (
      request_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      usernames TEXT NOT NULL,
      total_username INTEGER NOT NULL,
      total_process INTEGER DEFAULT 0,
      total_error INTEGER DEFAULT 0,
      total_success INTEGER DEFAULT 0,
      result TEXT,
      process_status TEXT DEFAULT 'pending',
      callback_url TEXT,
      callback_response TEXT,
      callback_retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS request_tiktok_profiles`);
};
