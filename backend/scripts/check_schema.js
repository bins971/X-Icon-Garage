require('dotenv').config();
const { getDb } = require('../src/config/database');

async function checkSchema() {
    try {
        const db = await getDb();
        const columns = await db.all("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'online_orders'");
        console.log('Columns in online_orders:', columns.map(c => c.name));
    } catch (err) {
        console.error('Error:', err);
    }
}

checkSchema();
