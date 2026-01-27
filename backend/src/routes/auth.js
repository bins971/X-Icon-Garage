const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    console.log('[Register] Request body:', req.body);
    const { username, password, name, phone, email } = req.body;
    const db = await getDb();
    let userId = null;

    try {
        const existing = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existing) {
            console.log('[Register] Username exists:', username);
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        userId = crypto.randomUUID();
        const customerIdForNewUser = crypto.randomUUID();

        // Create user
        await db.run(
            'INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)',
            [userId, username, hashedPassword, name, 'CUSTOMER']
        );
        console.log('[Register] User created:', userId);

        // Robustly create customer profile
        try {
            console.log('[Register] Creating customer profile...');
            await db.run(
                'INSERT INTO customers (id, name, phone, email, userId) VALUES (?, ?, ?, ?, ?)',
                [customerIdForNewUser, name, phone || '', email || (username.includes('@') ? username : ''), userId]
            );
            console.log('[Register] Customer profile created');
        } catch (customerError) {
            console.error('Customer profile creation failed:', customerError.message);
            // If it fails, we might want to fail the whole request or handle it gracefully
            // For now, logging it, but the vehicles endpoint will try to fix it later if missing
        }

        const token = jwt.sign(
            { id: userId, username, role: 'CUSTOMER', name },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            id: userId,
            username,
            name,
            role: 'CUSTOMER',
            token
        });
    } catch (error) {
        console.error('[Register] Error:', error);
        if (userId) {
            try {
                await db.run('DELETE FROM users WHERE id = ?', [userId]);
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError.message);
            }
        }
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await getDb();

    try {
        const user = await db.get(`
            SELECT u.id, u.username, u.password, u.name, u.role, c.email, c.phone, c.profileimage as "profileImage"
            FROM users u
            LEFT JOIN customers c ON u.id = c.userId
            WHERE u.username = ?
        `, [username]);

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    profileImage: user.profileImage
                },
                process.env.JWT_SECRET || 'secret123',
                { expiresIn: '30d' }
            );

            res.json({
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                token,
                profileImage: user.profileImage
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
});


const { upload } = require('../config/cloudinary');

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    const db = await getDb();
    const user = await db.get(`
        SELECT u.id, u.username, u.name, u.role, c.email, c.phone, c.profileimage as "profileImage"
        FROM users u
        LEFT JOIN customers c ON u.id = c.userId
        WHERE u.id = ?
    `, [req.user.id]);
    res.json(user);
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, upload.single('profileImage'), async (req, res) => {
    const { name, email, phone } = req.body;
    const db = await getDb();
    const userId = req.user.id;

    try {
        let profileImageUrl;
        if (req.file) {
            profileImageUrl = req.file.path;
        }

        await db.run(
            'UPDATE users SET name = ? WHERE id = ?',
            [name, userId]
        );

        // Also update customer table
        await db.run(
            'UPDATE customers SET name = ?, email = ?, phone = ?, profileimage = COALESCE(?, profileimage) WHERE userid = ?',
            [name, email, phone, profileImageUrl, userId]
        );

        const updatedUser = await db.get(`
            SELECT u.id, u.username, u.name, u.role, c.email, c.phone, c.profileimage as "profileImage"
            FROM users u
            LEFT JOIN customers c ON u.id = c.userId
            WHERE u.id = ?
        `, [userId]);

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
