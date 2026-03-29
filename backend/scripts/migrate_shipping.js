require('dotenv').config();
const { getDb } = require('../src/config/database');

async function migrate() {
    try {
        console.log('Starting migration...');
        const db = await getDb();

        const columns = [
            { name: 'delivery_method', type: 'TEXT DEFAULT \'PICKUP\'' },
            { name: 'shipping_address', type: 'TEXT' },
            { name: 'shipping_city', type: 'TEXT' },
            { name: 'shipping_province', type: 'TEXT' },
            { name: 'shipping_postal', type: 'TEXT' },
            { name: 'shipping_fee', type: 'NUMERIC DEFAULT 0' }, // Changed to NUMERIC for currency
            { name: 'courier_name', type: 'TEXT' },
            { name: 'tracking_number', type: 'TEXT' }
        ];

        for (const col of columns) {
            try {
                // Check if column exists first to avoid errors (Idempotent)
                // Note: accurate check depends on DB, but ADD COLUMN IF NOT EXISTS is valid in PG 9.6+
                await db.run(`ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
                console.log(`Added column: ${col.name}`);
            } catch (err) {
                console.log(`Error adding column ${col.name} (might already exist):`, err.message);
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
