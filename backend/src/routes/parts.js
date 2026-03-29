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
            WHERE isArchived = 0
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
    const image = req.file ? req.file.path : null;

    // Helper function to insert part
    const insertPart = async () => {
        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO parts (id, partNumber, name, description, supplier, buyingPrice, sellingPrice, quantity, minThreshold, isPublic, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, partNumber, name, description, supplier, Number(buyingPrice), Number(sellingPrice), Number(quantity) || 0, Number(minThreshold) || 5, (String(isPublic) === 'true' || isPublic === '1' || isPublic === 1) ? 1 : 0, image]
        );
        return id;
    };

    try {
        const id = await insertPart();
        await logActivity(req.user.id, 'CREATE', 'PART', id, `Added part: ${name}`);

        const part = await db.get(`
            SELECT id, partnumber as "partNumber", name, description, supplier, buyingprice as "buyingPrice", 
                   sellingprice as "sellingPrice", quantity, minthreshold as "minThreshold", ispublic as "isPublic", 
                   createdat as "createdAt", updatedat as "updatedAt" 
            FROM parts WHERE id = ?
        `, [id]);
        res.status(201).json(part);

    } catch (error) {
        // Handle Unique Constraint Violation (Part Number Collision)
        if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key value')) {
            try {
                // Check if the collision is with an ARCHIVED part
                const existingPart = await db.get('SELECT id, isArchived FROM parts WHERE partNumber = ?', [partNumber]);

                if (existingPart && existingPart.isArchived) {
                    // Logic: Rename the old archived part to free up the Part Number
                    const archivedSuffix = `_ARCHIVED_${Date.now()}`;
                    await db.run('UPDATE parts SET partNumber = partNumber || ? WHERE id = ?', [archivedSuffix, existingPart.id]);

                    // Retry Insert
                    const id = await insertPart();
                    await logActivity(req.user.id, 'CREATE', 'PART', id, `Added part: ${name} (Replaced Archived)`);

                    const part = await db.get(`
                        SELECT id, partnumber as "partNumber", name, description, supplier, buyingprice as "buyingPrice", 
                               sellingprice as "sellingPrice", quantity, minthreshold as "minThreshold", ispublic as "isPublic", 
                               createdat as "createdAt", updatedat as "updatedAt" 
                        FROM parts WHERE id = ?
                    `, [id]);
                    return res.status(201).json(part);
                } else {
                    return res.status(400).json({ message: 'Part Number already exists in active inventory.' });
                }
            } catch (retryError) {
                console.error('Retry Insert Error:', retryError);
                return res.status(500).json({ message: 'Failed to resolve duplicate part number.' });
            }
        }
        console.error('Create Part Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Adjust stock quantity (Add/Deduct manually)
// @route   PATCH /api/parts/:id/stock
router.patch('/:id/stock', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { id } = req.params;
    const { action, quantity, reason } = req.body; // action: 'ADD' | 'DEDUCT'

    if (!['ADD', 'DEDUCT'].includes(action) || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid action or quantity' });
    }

    const db = await getDb();

    try {
        const part = await db.get('SELECT * FROM parts WHERE id = ?', [id]);
        if (!part) return res.status(404).json({ message: 'Part not found' });

        let newQuantity = part.quantity;
        if (action === 'ADD') {
            newQuantity += Number(quantity);
        } else {
            newQuantity -= Number(quantity);
            // Allow negative? Ideally no, but manual override might need it. Let's warn but allow? 
            // Better to block if it goes below zero for sanity, unless explicitly forced. 
            // For now, simple block.
            if (newQuantity < 0) {
                return res.status(400).json({ message: `Insufficient stock. Current: ${part.quantity}` });
            }
        }

        await db.run('UPDATE parts SET quantity = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?', [newQuantity, id]);

        await logActivity(
            req.user.id,
            'UPDATE',
            'INVENTORY',
            id,
            `${action} stock by ${quantity}. Reason: ${reason || 'Manual Adjustment'}`
        );

        res.json({ message: 'Stock updated successfully', newQuantity });

    } catch (error) {
        console.error('Stock Adjustment Error:', error);
        res.status(500).json({ message: 'Server error' });
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
        // If FK violation (used in job orders), perform Soft Delete (Archive)
        if (error.message.includes('foreign key constraint') || error.code === '23503' || error.code === 'SQLITE_CONSTRAINT') {
            try {
                await db.run('UPDATE parts SET isArchived = 1 WHERE id = ?', [req.params.id]);
                await logActivity(req.user.id, 'ARCHIVE', 'PART', req.params.id, 'Archived part (used in history)');
                return res.json({ message: 'Part archived (preserved order history)' });
            } catch (archiveError) {
                return res.status(500).json({ message: 'Failed to archive part' });
            }
        }
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
