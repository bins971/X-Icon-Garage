require('@dotenvx/dotenvx').config({ path: require('path').resolve(__dirname, '../.env') });
const { getDb } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        const db = await getDb();
        const hashedPassword = await bcrypt.hash('xicongarage12345', 10);

        await db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'xicongarage']);
        console.log('Admin password reset to: xicongarage12345');
        process.exit(0);
    } catch (error) {
        console.error('Failed to reset password:', error);
        process.exit(1);
    }
}

resetAdmin();
