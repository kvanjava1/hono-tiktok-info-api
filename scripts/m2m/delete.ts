import { getSqliteDb } from '../../src/database/sqlite.connection.ts';

/**
 * CLI utility to delete an API client.
 * Usage: 
 * bun run scripts/m2m/delete.ts "<clientId>" [--confirm]
 */

const deleteClient = async () => {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('\n❌ Usage: bun run scripts/m2m/delete.ts "<clientId>" [--confirm]');
        console.log('Example: bun run scripts/m2m/delete.ts "web_01" --confirm\n');
        process.exit(1);
    }

    const clientId = args[0];
    const isConfirmed = args.includes('--confirm');

    if (!isConfirmed) {
        console.log(`\n⚠️  WARNING: You are about to delete client ID "${clientId}".`);
        console.log('This will NOT delete their usage logs, but they will lose all API access immediately.');
        console.log('To proceed, add the --confirm flag.\n');
        process.exit(0);
    }

    console.log(`\n⏳ Deleting client ID "${clientId}"...`);

    try {
        const db = getSqliteDb();

        // Check if exists
        const client = db.query('SELECT name FROM api_clients WHERE client_id = ?').get(clientId);
        if (!client) {
            console.error(`❌ Error: Client ID "${clientId}" not found.\n`);
            process.exit(1);
        }

        db.run('DELETE FROM api_clients WHERE client_id = ?', [clientId]);

        console.log('✅ Client successfully deleted!');
        console.log('------------------------------------');
        console.log(`Client ID: ${clientId}`);
        console.log('------------------------------------\n');

    } catch (error: any) {
        console.error('❌ Error deleting client:', error.message, '\n');
    }
};

deleteClient();
