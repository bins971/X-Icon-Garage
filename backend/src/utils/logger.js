const { getDb } = require('../config/database');
const crypto = require('crypto');

async function logActivity(userId, action, entity, entityId, details) {
    const db = await getDb();
    try {
        await db.run(
            'INSERT INTO activity_logs (id, userId, action, entity, entityId, details) VALUES (?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), userId, action, entity, entityId, details]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

module.exports = { logActivity };
