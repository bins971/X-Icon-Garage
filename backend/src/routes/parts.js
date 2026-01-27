const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const crypto = require('crypto');

const { upload } = require('../config/cloudinary');

// @desc    Get all parts
// @route   GET /api/parts
router.get('/', protect, async (req, res) => {
    const db = await getDb();
    try {
        const parts = await db.all(`
            SELECT 
                id, 
                partnumber as "partNumber", 
                name, 
                description, 
                supplier, 
                buyingprice as "buyingPrice", 
                sellingprice as "sellingPrice", 
                quantity, 
                minthreshold as "minThreshold", 
                ispublic as "isPublic", 
                image,
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM parts 
            ORDER BY name ASC
        `);
        res.json(parts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a part
// @route   POST /api/parts
router.post('/', protect, authorize('ADMIN', 'ADVISOR'), upload.single('image'), async (req, res) => {
    const { partNumber, name, description, supplier, buyingPrice, sellingPrice, quantity, minThreshold, isPublic } = req.body;
    const db = await getDb();

    // Get image filename if uploaded
    // Get image filename if uploaded
    const image = req.file ? req.file.path : null;

    try {
        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO parts (id, partNumber, name, description, supplier, buyingPrice, sellingPrice, quantity, minThreshold, isPublic, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, partNumber, name, description, supplier, buyingPrice, sellingPrice, quantity || 0, minThreshold || 5, isPublic !== undefined ? isPublic : 1, image]
        );

        await logActivity(req.user.id, 'CREATE', 'PART', id, `Added part: ${name}`);

        const part = await db.get(`
            SELECT 
                id, 
                partnumber as "partNumber", 
                name, 
                description, 
                supplier, 
                buyingprice as "buyingPrice", 
                sellingprice as "sellingPrice", 
                quantity, 
                minthreshold as "minThreshold", 
                ispublic as "isPublic", 
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM parts 
            WHERE id = ?
        `, [id]);
        res.status(201).json(part);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key value')) {
            return res.status(400).json({ message: 'Part Number already exists' });
        }
        console.error('Create Part Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a part
// @route   DELETE /api/parts/:id
router.delete('/:id', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const db = await getDb();
    try {
        await db.run('DELETE FROM parts WHERE id = ?', [req.params.id]);
        await logActivity(req.user.id, 'DELETE', 'PART', req.params.id, 'Deleted part from inventory');
        res.json({ message: 'Part removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
