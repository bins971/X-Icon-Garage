const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { getDb } = require('../config/database');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// @desc    Upload attachment for Job Order
// @route   POST /api/upload/:jobOrderId
router.post('/:jobOrderId', protect, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const db = await getDb();
    const id = crypto.randomUUID();
    const fileUrl = req.file.path;

    try {
        await db.run(
            'INSERT INTO job_order_attachments (id, jobOrderId, fileUrl, fileType, uploadedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [id, req.params.jobOrderId, fileUrl, req.file.mimetype]
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            file: { id, fileUrl, type: req.file.mimetype }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get attachments for Job Order
// @route   GET /api/upload/:jobOrderId
router.get('/:jobOrderId', protect, async (req, res) => {
    const db = await getDb();
    try {
        const files = await db.all('SELECT * FROM job_order_attachments WHERE jobOrderId = ? ORDER BY uploadedAt DESC', [req.params.jobOrderId]);
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
