const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const crypto = require('crypto');
const { protect, authorize } = require('../middleware/auth');


// @access  Public
router.post('/public', async (req, res) => {
    const { customerName, email, phone, date, serviceType, notes, address } = req.body;

    if (!customerName || !phone || !date || !serviceType) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format.' });
    }
    if (bookingDate < new Date()) {
        return res.status(400).json({ message: 'Booking date cannot be in the past.' });
    }

    try {
        const db = await getDb();
        const id = crypto.randomUUID();
        const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const bookingRef = `APT-${suffix}`;

        // If Home Service, append address to notes for admin view
        let finalNotes = notes || '';
        if (serviceType === 'Home Service' && address) {
            finalNotes = `[HOME SERVICE LOCATION]: ${address}\n\n${finalNotes}`;
        }

        await db.run(
            `INSERT INTO appointments (id, bookingref, customername, email, phone, date, servicetype, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, bookingRef, customerName, email, phone, date, serviceType, finalNotes]
        );


        // Send Notification (fire-and-forget, non-blocking)
        if (email) {
            const { logNotification } = require('../utils/notifier');
            logNotification('BOOKING_REQUESTED', email, {
                customerName,
                bookingRef,
                date: new Date(date).toLocaleString(),
                serviceType,
                address: serviceType === 'Home Service' ? address : null
            }).catch(err => console.warn('Failed to send booking notification:', err.message));
        }

        res.status(201).json({ message: 'Appointment requested successfully.', id, bookingRef });
    } catch (error) {
        console.error('Booking Error Details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail
        });
        res.status(500).json({ message: error.message || 'Server error' });
    }
});


// @access  Private (Admin/Advisor)
router.get('/', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    try {
        const db = await getDb();
        const appointments = await db.all(`
            SELECT 
                id,
                bookingref as "bookingRef",
                customername as "customerName",
                email,
                phone,
                date,
                servicetype as "serviceType",
                status,
                notes,
                createdat as "createdAt",
                updatedat as "updatedAt"
            FROM appointments 
            ORDER BY createdat DESC
        `);
        res.json(appointments);
    } catch (error) {
        console.error('Get Bookings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Private (Admin/Advisor)
router.patch('/:id', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const db = await getDb();

        // Fetch appointment for notification details
        const appt = await db.get(`
            SELECT 
                id, 
                customername as "customerName", 
                bookingref as "bookingRef", 
                email, 
                date,
                servicetype as "serviceType"
            FROM appointments 
            WHERE id = ?
        `, [req.params.id]);

        await db.run('UPDATE appointments SET status = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);

        if (appt && appt.email) {
            const { logNotification } = require('../utils/notifier');
            logNotification(`APPOINTMENT_${status}`, appt.email, {
                customerName: appt.customerName,
                bookingRef: appt.bookingRef,
                date: new Date(appt.date).toLocaleString(),
                status: status,
                serviceType: appt.serviceType
            }).catch(err => console.warn('Notification Error:', err.message));
        }

        res.json({ message: 'Appointment updated' });
    } catch (error) {
        console.error('Update Booking Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Private (Admin)
router.delete('/purge', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const db = await getDb();
        const result = await db.run("DELETE FROM appointments WHERE status IN ('CANCELLED', 'COMPLETED')");
        res.json({ message: `${result.changes} inactive appointments purged` });
    } catch (error) {
        console.error('Purge Bookings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Private (Admin)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const db = await getDb();
        await db.run('DELETE FROM appointments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Appointment removed' });
    } catch (error) {
        console.error('Delete Booking Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
