import { findByName, getUsageCount } from '../../src/repositories/apiClient.repository.ts';

/**
 * CLI utility to check API client details by name.
 * Usage: 
 * bun run scripts/m2m/check.ts "<name>"
 */

const checkClient = async () => {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log('\n❌ Usage: bun run scripts/m2m/check.ts "<name>"');
        console.log('Example: bun run scripts/m2m/check.ts "nexus"\n');
        process.exit(1);
    }

    const name = args[0];
    if (!name) return;

    console.log(`\n⏳ Checking client "${name}"...`);

    const client = findByName(name);

    if (!client) {
        console.log(`❌ Error: Client with name "${name}" not found.\n`);
        process.exit(1);
    }

    console.log('✅ Client details found!');

    // Today's start (00:00:00)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msSinceMidnight = now.getTime() - startOfToday;

    const usageCount = getUsageCount(client.client_id, msSinceMidnight);
    const usagePercent = ((usageCount / client.rate_limit) * 100).toFixed(1);

    console.log('------------------------------------');
    console.log(`Name:        ${client.name}`);
    console.log(`Client ID:   ${client.client_id}`);
    console.log(`Secret:      [SECURELY HASHED] (Cannot be viewed in plaintext)`);
    console.log(`Rate Limit:  ${client.rate_limit} req/hr`);
    console.log(`Used (Today): ${usageCount} (${usagePercent}%)`);
    console.log(`Allowed IPs: ${client.allowed_ips || 'Any'}`);
    console.log(`Status:      ${client.status}`);
    console.log(`Created At:  ${client.created_at}`);
    console.log(`Updated At:  ${client.updated_at}`);
    console.log('------------------------------------\n');

    console.log('💡 Note: For security reasons, the plaintext secret is not stored.');
    console.log('If you have lost the secret, you must manually update the database row or recreate the client.\n');
};

checkClient();
