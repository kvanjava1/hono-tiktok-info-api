import { getSqliteDb } from '../../src/database/sqlite.connection.ts';

/**
 * CLI utility to update the status of an API client (active/suspended).
 * Usage: 
 * bun run scripts/m2m/status.ts "<clientId>" "<active|suspended>"
 */

const updateStatus = async () => {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('\n❌ Usage: bun run scripts/m2m/status.ts "<clientId>" "<active|suspended>"');
        console.log('Example: bun run scripts/m2m/status.ts "web_01" "suspended"\n');
        process.exit(1);
    }

    const [clientId, status] = args;
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus !== 'active' && normalizedStatus !== 'suspended') {
        console.error('❌ Error: Status must be either "active" or "suspended".');
        process.exit(1);
    }

    console.log(`\n⏳ Updating status for client ID "${clientId}" to "${normalizedStatus}"...`);

    try {
        const db = getSqliteDb();

        // Check if exists
        const client = db.query('SELECT name FROM api_clients WHERE client_id = ?').get(clientId);
        if (!client) {
            console.error(`❌ Error: Client ID "${clientId}" not found.\n`);
            process.exit(1);
        }

        db.run(
            'UPDATE api_clients SET status = ?, updated_at = datetime("now") WHERE client_id = ?',
            [normalizedStatus, clientId]
        );

        console.log('✅ Status successfully updated!');
        console.log('------------------------------------');
        console.log(`Client ID: ${clientId}`);
        console.log(`New Status: ${normalizedStatus.toUpperCase()}`);
        console.log('------------------------------------\n');

    } catch (error: any) {
        console.error('❌ Error updating status:', error.message, '\n');
    }
};

updateStatus();
