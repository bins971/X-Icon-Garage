const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { sendInquiryNotification } = require('../services/emailService');
const crypto = require('crypto');

// @desc    Submit a new inquiry
// @route   POST /api/inquiries
router.post('/', async (req, res) => {
    const { customerName, email, phone, message, partId, partName } = req.body;

    if (!customerName || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const db = await getDb();
    const id = crypto.randomUUID();

    try {
        await db.run(
            'INSERT INTO inquiries (id, customerName, email, phone, message, partId, partName) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, customerName, email, phone, message, partId, partName]
        );

        // Send notification to admin (non-blocking)
        sendInquiryNotification({ customerName, email, phone, message, partName }).catch(err =>
            console.error('Failed to send inquiry notification:', err)
        );

        res.status(201).json({ message: 'Inquiry received. We will contact you soon!' });
    } catch (error) {
        console.error('Inquiry Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all inquiries (Admin)
// @route   GET /api/inquiries
router.get('/', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {

    const db = await getDb();
    try {
        const inquiries = await db.all(`
            SELECT 
                inquiries.id,
                inquiries.customerName as "customerName",
                inquiries.email,
                inquiries.phone,
                inquiries.message,
                inquiries.partId as "partId",
                inquiries.partName as "partName",
                inquiries.status,
                inquiries.createdAt as "createdAt",
                parts.image as "partImage",
                parts.partNumber as "partNumber",
                parts.sellingPrice as "partPrice"
            FROM inquiries 
            LEFT JOIN parts ON inquiries.partId = parts.id 
            ORDER BY 
                CASE WHEN inquiries.status = 'NEW' THEN 1 ELSE 2 END ASC,
                inquiries.createdAt DESC
        `);
        res.json(inquiries);
    } catch (error) {
        console.error('Fetch Inquiries Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
