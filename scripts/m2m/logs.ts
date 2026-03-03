import { getSqliteDb } from '../../src/database/sqlite.connection.ts';

/**
 * Utility to check M2M activity logs with filters.
 * Usage:
 * bun run scripts/m2m/logs.ts [limit] [clientId]
 * bun run scripts/m2m/logs.ts 50
 * bun run scripts/m2m/logs.ts 20 test_client
 */
const checkLogs = () => {
    const args = process.argv.slice(2);
    const limit = args[0] ? parseInt(args[0]) : 20;
    const clientIdFilter = args[1] || null;

    console.log(`\n🔍 Fetching latest ${limit} M2M activity logs${clientIdFilter ? ` for ${clientIdFilter}` : ''}...\n`);

    try {
        const db = getSqliteDb();

        // 1. Daily Summary
        const todayStart = new Date().toISOString().split('T')[0] + ' 00:00:00';
        let summaryQuery = 'SELECT COUNT(*) as total FROM api_usage_logs WHERE timestamp >= ?';
        let summaryParams: any[] = [todayStart];

        if (clientIdFilter) {
            summaryQuery += ' AND client_id = ?';
            summaryParams.push(clientIdFilter);
        }

        const summary = db.query(summaryQuery).get(...summaryParams) as { total: number };
        console.log(`📊 TOTAL USAGE (Today): ${summary.total} requests`);
        console.log('-------------------------------------------\n');

        // 2. Log List
        let logQuery = 'SELECT * FROM api_usage_logs';
        let logParams: any[] = [];

        if (clientIdFilter) {
            logQuery += ' WHERE client_id = ?';
            logParams.push(clientIdFilter);
        }

        logQuery += ' ORDER BY timestamp DESC LIMIT ?';
        logParams.push(limit);

        const logs = db.query(logQuery).all(...logParams) as any[];

        if (logs.length === 0) {
            console.log('📝 No logs found.');
            return;
        }

        logs.forEach((log, index) => {
            console.log(`--- [LOG #${index + 1}] ${log.timestamp} ---`);
            console.log(`Client:   ${log.client_id}`);
            console.log(`Endpoint: ${log.method} ${log.endpoint}`);
            console.log(`Status:   ${log.status_code}`);
            console.log(`IP:       ${log.ip_address}`);

            if (log.method === 'POST') {
                console.log(`Request:  ${log.request_body || 'EMPTY'}`);
            }
            console.log(`Response: ${log.response_body || 'EMPTY'}`);
            console.log('-------------------------------------------\n');
        });
    } catch (error: any) {
        console.error('❌ Error reading logs:', error.message);
    }
};

checkLogs();
