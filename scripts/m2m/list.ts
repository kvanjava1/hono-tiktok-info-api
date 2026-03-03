import { getSqliteDb } from '../../src/database/sqlite.connection.ts';

/**
 * CLI utility to list all registered M2M clients.
 * Usage: bun run scripts/m2m/list.ts
 */
const listClients = () => {
    console.log('\n📋 Listing all M2M API Clients...\n');

    try {
        const db = getSqliteDb();
        const clients = db.query('SELECT id, name, client_id, status, rate_limit FROM api_clients ORDER BY created_at DESC').all() as any[];

        if (clients.length === 0) {
            console.log('📝 No clients found in api_clients table.');
            return;
        }

        console.log('ID  | Status     | Rate  | Client ID            | Name');
        console.log('----|------------|-------|----------------------|----------------------');

        clients.forEach(client => {
            const id = String(client.id).padEnd(3);
            const status = String(client.status).padEnd(10);
            const limit = String(client.rate_limit).padEnd(5);
            const clientId = String(client.client_id).padEnd(20);
            const name = client.name;

            console.log(`${id} | ${status} | ${limit} | ${clientId} | ${name}`);
        });

        console.log(`\nTotal: ${clients.length} clients\n`);

    } catch (error: any) {
        console.error('❌ Error listing clients:', error.message);
    }
};

listClients();
