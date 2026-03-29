require('@dotenvx/dotenvx').config({ path: require('path').resolve(__dirname, '../.env') });
const { getDb } = require('../src/config/database');

async function checkAdmin() {
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, username, password, role FROM users WHERE username = ?', ['xicongarage']);
        console.log('User found:', user ? { ...user, password: user.password.substring(0, 10) + '...' } : 'NULL');
        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

checkAdmin();
