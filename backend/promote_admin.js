const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log('Promoting customers to admin...');
        await pool.query("UPDATE users SET role = 'ADMIN' WHERE role = 'CUSTOMER'");
        console.log('Success.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
