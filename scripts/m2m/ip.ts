import * as ClientRepository from '../../src/repositories/apiClient.repository.ts';

/**
 * CLI utility to manage allowed IPs for API clients.
 * Usage: 
 * bun run scripts/m2m/ip.ts add <clientId> <ip>
 * bun run scripts/m2m/ip.ts remove <clientId> <ip>
 * bun run scripts/m2m/ip.ts clear <clientId>
 */

const manageIp = async () => {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('\n❌ Usage:');
        console.log('  bun run scripts/m2m/ip.ts add <clientId> <ip>');
        console.log('  bun run scripts/m2m/ip.ts remove <clientId> <ip>');
        console.log('  bun run scripts/m2m/ip.ts clear <clientId>');
        process.exit(1);
    }

    const [action, clientId, ip] = args;

    if (!clientId) {
        console.error('\n❌ Error: Client ID is required.\n');
        process.exit(1);
    }

    const client = ClientRepository.findByClientId(clientId);

    if (!client) {
        console.error(`\n❌ Error: Client ID "${clientId}" not found.\n`);
        process.exit(1);
    }

    let currentIps = client.allowed_ips
        ? client.allowed_ips.split(',').map(i => i.trim()).filter(Boolean)
        : [];

    switch (action) {
        case 'add':
            if (!ip) {
                console.error('\n❌ Error: IP address is required for "add" action.\n');
                process.exit(1);
            }
            if (currentIps.includes(ip)) {
                console.log(`\n⚠️ IP "${ip}" is already in the allowed list for client "${client.name}".`);
            } else {
                currentIps.push(ip);
                ClientRepository.updateAllowedIps(clientId, currentIps.join(', '));
                console.log(`\n✅ IP "${ip}" added to allowed list for client "${client.name}".`);
            }
            break;

        case 'remove':
            if (!ip) {
                console.error('\n❌ Error: IP address is required for "remove" action.\n');
                process.exit(1);
            }
            if (!currentIps.includes(ip)) {
                console.log(`\n⚠️ IP "${ip}" is not in the allowed list for client "${client.name}".`);
            } else {
                currentIps = currentIps.filter(i => i !== ip);
                const newVal = currentIps.length > 0 ? currentIps.join(', ') : null;
                ClientRepository.updateAllowedIps(clientId, newVal);
                console.log(`\n✅ IP "${ip}" removed from allowed list for client "${client.name}".`);
            }
            break;

        case 'clear':
            ClientRepository.updateAllowedIps(clientId, null);
            console.log(`\n✅ Allowed IPs list cleared for client "${client.name}". All IPs now allowed.`);
            break;

        default:
            console.error(`\n❌ Error: Invalid action "${action}". Use add, remove, or clear.\n`);
            process.exit(1);
    }

    const updatedClient = ClientRepository.findByClientId(clientId);
    console.log('------------------------------------');
    console.log(`Name:        ${updatedClient?.name}`);
    console.log(`Client ID:   ${updatedClient?.client_id}`);
    console.log(`Allowed IPs: ${updatedClient?.allowed_ips || 'Any'}`);
    console.log('------------------------------------\n');
};

manageIp();
