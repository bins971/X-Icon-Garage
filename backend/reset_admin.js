const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('@dotenvx/dotenvx').config({ path: require('path').resolve(__dirname, './.env') });

const resetAdmin = async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:CHARP12345@localhost:5432/postgres" });
    try {
        const hashedPassword = await bcrypt.hash('xicongarage12345', 10);
        console.log('New hash for xicongarage12345:', hashedPassword);

        const res = await pool.query(
            'UPDATE users SET password = $1 WHERE username = \'xicongarage\' RETURNING *',
            [hashedPassword]
        );

        if (res.rows.length > 0) {
            console.log('X-ICON Garage admin password updated successfully!');
        } else {
            console.log('Admin user xicongarage not found. Creating it...');
            await pool.query(
                'INSERT INTO users (id, name, username, password, role) VALUES ($1, $2, $3, $4, $5)',
                [require('crypto').randomUUID(), 'X-ICON Manager', 'xicongarage', hashedPassword, 'ADMIN']
            );
            console.log('X-ICON Garage admin user created successfully!');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
