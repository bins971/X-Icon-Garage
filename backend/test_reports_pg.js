const { Pool } = require('pg');
require('@dotenvx/dotenvx').config({ path: require('path').resolve(__dirname, './.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testEndpoints() {
    const endpoints = [
        '/reports/dashboard',
        '/job-orders?isArchived=false',
        '/reports/stock-alerts',
        '/reports/revenue',
        '/reports/wallet',
        '/reports/activity'
    ];

    console.log('Testing Report Endpoints...');
    for (const ep of endpoints) {
        try {
            console.log(`\nEndpoint: ${ep}`);
            // Note: Since we don't have a token easily here for 'protect', we might need to skip auth or mock it.
            // But I can run the queries directly.
        } catch (e) {
            console.error(e.message);
        }
    }
}

async function testQueries() {
    try {
        console.log('--- Testing Dashboard Query ---');
        const res1 = await pool.query(`
            SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(revenue) as revenue
            FROM (
                SELECT createdAt as date, amount as revenue FROM payments
                UNION ALL
                SELECT createdAt as date, totalAmount as revenue FROM online_orders
            ) combined
            GROUP BY 1
            ORDER BY 1 DESC
            LIMIT 6
        `);
        console.log('Dashboard Revenue Keys:', Object.keys(res1.rows[0] || {}));

        console.log('\n--- Testing Wallet Query ---');
        const res2 = await pool.query('SELECT COALESCE(SUM(totalAmount), 0) as total FROM online_orders WHERE status != \'CANCELLED\'');
        console.log('Wallet Total Row:', res2.rows[0]);

        console.log('\n--- Testing Activity Query ---');
        const res3 = await pool.query(`
            SELECT 
                j.id, j.jobNumber, j.status, j.priority, j.createdAt, j.updatedAt,
                c.name as customerName,
                v.make, v.model,
                u.name as mechanicName
            FROM job_orders j
            LEFT JOIN customers c ON j.customerId = c.id
            LEFT JOIN vehicles v ON j.vehicleId = v.id
            LEFT JOIN users u ON j.mechanicId = u.id
            ORDER BY j.updatedAt DESC
            LIMIT 10
        `);
        console.log('Activity First Row Keys:', Object.keys(res3.rows[0] || {}));

    } catch (e) {
        console.error('QUERY ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

testQueries();
