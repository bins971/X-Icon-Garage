const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// Environment variables are loaded in server.js via @dotenvx/dotenvx

// Force numeric types to be returned as numbers rather than strings
types.setTypeParser(1700, val => parseFloat(val));


const connectionString = process.env.DB_URL || process.env.DATABASE_URL;

// Audit Environment Variable Keys (Safe)
console.log('[DB] Auditing environment keys:');
Object.keys(process.env).forEach(key => {
    if (key.includes('DATABASE') || key.includes('DB_') || key.includes('POSTGRES')) {
        console.log(`  - Found key: ${key} (Value: ${process.env[key].startsWith('encrypted') ? 'Encrypted' : 'Plaintext'})`);
    }
});

if (!connectionString) {
    console.error('DATABASE_URL is not defined in the environment.');
} else {
    try {
        // Safe extraction of hostname for diagnostics
        const urlMatch = connectionString.match(/@([^/:]+)/);
        const hostname = urlMatch ? urlMatch[1] : 'unknown';
        const masked = connectionString.replace(/:([^@]+)@/, ':****@');

        console.log(`[DB] Protocol: ${connectionString.split(':')[0]}`);
        console.log(`[DB] Target Host: ${hostname}`);

        if (hostname === 'base') {
            console.warn('\n' + '!'.repeat(50));
            console.warn('WARNING: Hostname is set to "base".');
            console.warn('This usually means a docker-compose service name is leaking into production.');
            console.warn('Check Railway Environment Variables for hardcoded local URLs.');
            console.warn('!'.repeat(50) + '\n');
        }

        console.log('Connecting to database with:', masked);
    } catch (e) {
        console.log('Connecting to database with (malformed URL):', connectionString);
    }
}

const pool = new Pool({
    connectionString: connectionString && connectionString.startsWith('prisma+postgres')
        ? undefined
        : connectionString,
    ssl: (connectionString && (
        connectionString.includes('neon.tech') ||
        connectionString.includes('sslmode=require') ||
        connectionString.includes('railway.app') ||
        connectionString.includes('.rlwy.net') ||
        connectionString.includes('internal')
    )) ? { rejectUnauthorized: false } : undefined
});

class DatabaseWrapper {
    constructor(pool) {
        this.pool = pool;
    }

    _convertPlaceholders(query) {
        let index = 1;
        return query.replace(/\+/g, '+').replace(/\?/g, () => `$${index++}`);
    }

    async run(query, params = []) {
        const convertedQuery = this._convertPlaceholders(query);
        const result = await this.pool.query(convertedQuery, params);
        return {
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount
        };
    }

    async get(query, params = []) {
        const convertedQuery = this._convertPlaceholders(query);
        const result = await this.pool.query(convertedQuery, params);
        return result.rows[0] || null;
    }

    async all(query, params = []) {
        const convertedQuery = this._convertPlaceholders(query);
        const result = await this.pool.query(convertedQuery, params);
        return result.rows;
    }

    async exec(query) {
        return await this.pool.query(query);
    }
}

const dbWrapper = new DatabaseWrapper(pool);

async function initializeDb() {
    console.log('PostgreSQL migration: Initializing schema...');

    try {
        const client = await pool.connect();
        try {
            await client.query('SET TIME ZONE "UTC"');

            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT NOT NULL,
                    role TEXT CHECK(role IN ('ADMIN', 'ADVISOR', 'MECHANIC', 'ACCOUNTANT', 'CUSTOMER')) DEFAULT 'ADVISOR',
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            try {
                await client.query(`
                    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
                    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'ADVISOR', 'MECHANIC', 'ACCOUNTANT', 'CUSTOMER'));
                `);
            } catch (err) {
                console.log('Note: users_role_check already updated or has different name');
            }

            // Migration: Add securityPin to users
            try {
                await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "securityPin" TEXT');
                await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT');
                await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT FALSE');
            } catch (err) {
                console.log('Note: users security columns check handled');
            }

            // Customers table
            await client.query(`
                CREATE TABLE IF NOT EXISTS customers (
                    id UUID PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT NOT NULL,
                    address TEXT,
                    profileimage TEXT,
                    userId UUID REFERENCES users(id) ON DELETE SET NULL,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Migration: Add userId to customers if it doesn't exist
            try {
                await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS userId UUID REFERENCES users(id) ON DELETE SET NULL');
            } catch (err) {
                console.log('Note: customers.userId already exists or migration handled');
            }

            // Vehicles table
            await client.query(`
                CREATE TABLE IF NOT EXISTS vehicles (
                    id UUID PRIMARY KEY,
                    vin TEXT UNIQUE,
                    plateNumber TEXT UNIQUE NOT NULL,
                    make TEXT NOT NULL,
                    model TEXT NOT NULL,
                    year INTEGER,
                    color TEXT,
                    customerId UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Parts table
            await client.query(`
                CREATE TABLE IF NOT EXISTS parts (
                    id UUID PRIMARY KEY,
                    partNumber TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    supplier TEXT,
                    buyingPrice DECIMAL NOT NULL,
                    sellingPrice DECIMAL NOT NULL,
                    quantity INTEGER DEFAULT 0,
                    minThreshold INTEGER DEFAULT 5,
                    isPublic INTEGER DEFAULT 1,
                    image TEXT,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Migration: Add image to parts if it doesn't exist
            try {
                await client.query('ALTER TABLE parts ADD COLUMN IF NOT EXISTS image TEXT');
            } catch (err) {
                console.log('Note: parts.image already exists or migration handled');
            }

            // Migration: Add isArchived to parts
            try {
                await client.query('ALTER TABLE parts ADD COLUMN IF NOT EXISTS isArchived INTEGER DEFAULT 0');
            } catch (err) {
                console.log('Note: parts.isArchived already exists or migration handled');
            }

            // Job Orders table
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE job_status AS ENUM ('RECEIVED', 'DIAGNOSING', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'COMPLETED', 'RELEASED');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;

                DO $$ BEGIN
                    CREATE TYPE job_priority AS ENUM ('NORMAL', 'URGENT');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;

                CREATE TABLE IF NOT EXISTS job_orders (
                    id UUID PRIMARY KEY,
                    jobNumber TEXT UNIQUE NOT NULL,
                    customerId UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                    vehicleId UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                    mechanicId UUID REFERENCES users(id),
                    complaint TEXT NOT NULL,
                    inspectionNotes TEXT,
                    estimatedCost DECIMAL,
                    estimatedTime TEXT,
                    status TEXT DEFAULT 'RECEIVED',
                    priority TEXT DEFAULT 'NORMAL',
                    isArchived INTEGER DEFAULT 0,
                    notes TEXT,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Job Order Parts
            await client.query(`
                CREATE TABLE IF NOT EXISTS job_order_parts (
                    id UUID PRIMARY KEY,
                    jobOrderId UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
                    partId UUID NOT NULL REFERENCES parts(id),
                    quantity INTEGER NOT NULL,
                    unitPrice DECIMAL NOT NULL,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Invoices
            await client.query(`
                CREATE TABLE IF NOT EXISTS invoices (
                    id UUID PRIMARY KEY,
                    invoiceNumber TEXT UNIQUE NOT NULL,
                    jobOrderId UUID UNIQUE NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
                    totalAmount DECIMAL NOT NULL,
                    discount DECIMAL DEFAULT 0,
                    tax DECIMAL DEFAULT 0,
                    subTotal DECIMAL NOT NULL,
                    status TEXT DEFAULT 'UNPAID',
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Payments
            await client.query(`
                CREATE TABLE IF NOT EXISTS payments (
                    id UUID PRIMARY KEY,
                    invoiceId UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                    amount DECIMAL NOT NULL,
                    paymentMethod TEXT NOT NULL,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Activity Logs
            await client.query(`
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id UUID PRIMARY KEY,
                    userId UUID NOT NULL REFERENCES users(id),
                    action TEXT NOT NULL,
                    entity TEXT NOT NULL,
                    entityId UUID NOT NULL,
                    details TEXT,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Job Order Attachments
            await client.query(`
                CREATE TABLE IF NOT EXISTS job_order_attachments (
                    id UUID PRIMARY KEY,
                    jobOrderId UUID NOT NULL REFERENCES job_orders(id) ON DELETE CASCADE,
                    fileUrl TEXT NOT NULL,
                    fileType TEXT,
                    uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Appointments
            await client.query(`
                CREATE TABLE IF NOT EXISTS appointments (
                    id UUID PRIMARY KEY,
                    bookingRef TEXT UNIQUE,
                    customerName TEXT NOT NULL,
                    email TEXT,
                    phone TEXT NOT NULL,
                    date TIMESTAMP NOT NULL,
                    serviceType TEXT NOT NULL,
                    status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')) DEFAULT 'PENDING',
                    notes TEXT,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Migration: Add CASCADE to existing constraints
            try {
                // job_orders.customerId
                await client.query(`
                    ALTER TABLE job_orders DROP CONSTRAINT IF EXISTS job_orders_customerid_fkey;
                    ALTER TABLE job_orders ADD CONSTRAINT job_orders_customerid_fkey 
                    FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE;
                `);
                // job_orders.vehicleId
                await client.query(`
                    ALTER TABLE job_orders DROP CONSTRAINT IF EXISTS job_orders_vehicleid_fkey;
                    ALTER TABLE job_orders ADD CONSTRAINT job_orders_vehicleid_fkey 
                    FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE;
                `);
                // invoices.jobOrderId
                await client.query(`
                    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_joborderid_fkey;
                    ALTER TABLE invoices ADD CONSTRAINT invoices_joborderid_fkey 
                    FOREIGN KEY (jobOrderId) REFERENCES job_orders(id) ON DELETE CASCADE;
                `);
                console.log('[DB] Migration: Cascading constraints updated.');
            } catch (err) {
                console.log('[DB] Migration Note: Cascade update handled or manual check required.', err.message);
            }

            // Performance Packages table
            await client.query(`
                CREATE TABLE IF NOT EXISTS performance_packages (
                    id UUID PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    price DECIMAL NOT NULL,
                    features TEXT, -- JSON array
                    category TEXT,
                    isFeatured INTEGER DEFAULT 0,
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS online_orders (
                    id UUID PRIMARY KEY,
                    customerName TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    items TEXT NOT NULL, -- JSON string
                    totalAmount DECIMAL NOT NULL,
                    paymentMethod TEXT DEFAULT 'CASH',
                    status TEXT CHECK(status IN ('NEW', 'PROCESSED', 'COMPLETED', 'CANCELLED')) DEFAULT 'NEW',
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Migration: Add paymentMethod if missing
            try {
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS paymentMethod TEXT DEFAULT \'CASH\'');
                // Shipping columns migration
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT \'PICKUP\'');
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS shipping_address TEXT');
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS shipping_city TEXT');
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS shipping_province TEXT');
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS shipping_postal TEXT');
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0');
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS courier_name TEXT');
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS tracking_number TEXT');
                console.log('[DB] Migration: Shipping columns checked/added to online_orders.');

                // Migration: Update online_orders status check constraint
                await client.query(`
                    ALTER TABLE online_orders DROP CONSTRAINT IF EXISTS online_orders_status_check;
                    ALTER TABLE online_orders ADD CONSTRAINT online_orders_status_check 
                    CHECK (status IN ('NEW', 'PENDING', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'PROCESSED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'));
                `);
                console.log('[DB] Migration: online_orders_status_check updated.');
            } catch (err) {
                console.log('Note: online_orders columns migration handled', err.message);
            }

            // Migration: Add isArchived to online_orders
            try {
                await client.query('ALTER TABLE online_orders ADD COLUMN IF NOT EXISTS isArchived INTEGER DEFAULT 0');
                console.log('[DB] Migration: Added isArchived to online_orders.');
            } catch (err) {
                console.log('Note: online_orders isArchived migration handled', err.message);
            }

            await client.query(`
                CREATE TABLE IF NOT EXISTS store_payouts (
                    id UUID PRIMARY KEY,
                    amount DECIMAL NOT NULL,
                    method TEXT NOT NULL, -- 'BANK_TRANSFER', 'GCASH'
                    accountNumber TEXT,
                    status TEXT DEFAULT 'COMPLETED',
                    processedBy UUID REFERENCES users(id),
                    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Check for admin user
            const adminRes = await client.query('SELECT * FROM users WHERE username = $1', ['xicongarage']);
            if (adminRes.rowCount === 0) {
                console.log('Seeding admin user (xicongarage)...');
                const hashedPassword = await bcrypt.hash('xicongarage12345', 10);
                await client.query(
                    'INSERT INTO users (id, username, password, name, role) VALUES ($1, $2, $3, $4, $5)',
                    [crypto.randomUUID(), 'xicongarage', hashedPassword, 'X-ICON Manager', 'ADMIN']
                );
                console.log('Admin user seeded.');
            }

            // Cleanup old 'admin' user if it exists to prevent confusion
            await client.query('DELETE FROM users WHERE username = $1', ['admin']);

            // Seed Default PIN for Admin (123456) - Force Update to ensure valid state
            const adminUser = await client.query('SELECT * FROM users WHERE username = $1', ['xicongarage']);
            if (adminUser.rows.length > 0) {
                const hashedPin = await bcrypt.hash('123456', 10);
                await client.query('UPDATE users SET securityPin = $1 WHERE username = $2', [hashedPin, 'xicongarage']);
                console.log('Admin Security PIN verified/updated for xicongarage (123456).');
            }

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }

    return dbWrapper;
}

let dbInstance = null;

async function getDb() {
    if (!dbInstance) {
        dbInstance = await initializeDb();
    }
    return dbInstance;
}

module.exports = { getDb, initializeDb };
