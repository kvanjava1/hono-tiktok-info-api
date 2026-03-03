import bcrypt from 'bcryptjs';
import { getSqliteDb } from '../../src/database/sqlite.connection.ts';
import { BCRYPT_SALT_ROUNDS } from '../../src/configs/constants.ts';

/**
 * CLI utility to add new API clients for M2M authentication.
 * Usage: 
 * bun run scripts/m2m/add.ts "Client Name" "client_id" "client_secret" [rate_limit] [allowed_ips]
 */

const addClient = async () => {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.log('\n❌ Usage: bun run scripts/m2m/add.ts <name> <clientId> <clientSecret> [rateLimit] [allowedIps]');
        console.log('Example: bun run scripts/m2m/add.ts "My Website" web_01 secret_123 5000 "127.0.0.1, 192.168.1.1"');
        process.exit(1);
    }

    const [name, clientId, clientSecret, rateLimitStr, allowedIps] = args;
    if (!name || !clientId || !clientSecret) return;

    const rateLimit = rateLimitStr ? parseInt(rateLimitStr) : 1000;

    console.log(`\n⏳ Creating client "${name}"...`);

    try {
        const hashedSecret = await bcrypt.hash(clientSecret, BCRYPT_SALT_ROUNDS);
        const db = getSqliteDb();

        db.run(
            `INSERT INTO api_clients (name, client_id, client_secret, rate_limit, allowed_ips, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, clientId, hashedSecret, rateLimit, (allowedIps as any) || null, 'active']
        );

        console.log('✅ Client successfully created!');
        console.log('------------------------------------');
        console.log(`Name:        ${name}`);
        console.log(`Client ID:   ${clientId}`);
        console.log(`Secret:      ${clientSecret} (Stored as hash)`);
        console.log(`Rate Limit:  ${rateLimit} req/hr`);
        console.log(`Allowed IPs: ${allowedIps || 'Any'}`);
        console.log('------------------------------------\n');

    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            console.error(`❌ Error: Client ID "${clientId}" already exists.\n`);
        } else {
            console.error('❌ Error creating client:', error.message, '\n');
        }
    }
};

addClient();
