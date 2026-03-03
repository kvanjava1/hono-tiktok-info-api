import type { Database } from 'bun:sqlite';

export const name = '20260219_create_api_clients_table';

export const up = async (db: Database): Promise<void> => {
  // api_clients table: Stores credentials for external websites
  db.run(`
    CREATE TABLE IF NOT EXISTS api_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id TEXT UNIQUE NOT NULL,
      client_secret TEXT NOT NULL,
      rate_limit INTEGER DEFAULT 1000,
      allowed_ips TEXT, -- Comma-separated list of allowed IPs (null means any IP)
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Index for fast lookup by client_id during login
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_clients_client_id ON api_clients(client_id)`);

  // api_usage_logs table: Tracks usage and helps with rate limiting
  db.run(`
    CREATE TABLE IF NOT EXISTS api_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      ip_address TEXT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES api_clients(client_id)
    )
  `);

  // Index for usage tracking/reporting
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_usage_client_timestamp ON api_usage_logs(client_id, timestamp)`);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS api_usage_logs`);
  db.run(`DROP TABLE IF EXISTS api_clients`);
};
