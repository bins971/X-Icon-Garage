const { Pool } = require('pg');
require('@dotenvx/dotenvx').config({ path: require('path').resolve(__dirname, './.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
    try {
        console.log('Testing update on online_orders...');
        // First get an ID
        const res = await pool.query('SELECT id FROM online_orders LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No orders to test with.');
            process.exit(0);
        }
        const id = res.rows[0].id;
        console.log('Using ID:', id);

        // Try update
        const updateRes = await pool.query(
            'UPDATE online_orders SET status = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2',
            ['PROCESSED', id]
        );
        console.log('Update Success:', updateRes.rowCount, 'rows updated');
        process.exit(0);
    } catch (e) {
        console.error('UPDATE ERROR:', e.message);
        console.error('ERROR DETAIL:', e.detail);
        console.error('ERROR CODE:', e.code);
        process.exit(1);
    }
}
test();
