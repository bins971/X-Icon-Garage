const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
// @access  Public
router.post('/track', async (req, res) => {
    const { jobNumber, plateNumber } = req.body;

    if (!jobNumber || !plateNumber) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        const db = await getDb();
        if (jobNumber.toUpperCase().startsWith('APT-')) {
            const appointment = await db.get(
                `SELECT * FROM appointments 
                 WHERE bookingRef = ? AND (phone = ? OR email = ?)`,
                [jobNumber.toUpperCase(), plateNumber, plateNumber]
            );

            if (!appointment) {
                return res.status(404).json({ message: 'Appointment not found. Check Reference & Phone.' });
            }

            return res.json({
                jobNumber: appointment.bookingRef,
                status: appointment.status,
                priority: 'NORMAL',
                vehicle: `${appointment.serviceType} Request`,
                mechanic: 'Advisor Review',
                lastUpdated: appointment.updatedAt,
                created: appointment.createdAt,
                isAppointment: true
            });
        }

        // Otherwise, Search Job Orders
        const job = await db.get(
            `SELECT 
                j.id, j.jobNumber, j.status, j.priority, j.createdAt, j.updatedAt, 
                v.make, v.model, v.year, v.color,
                u.name as mechanicName
             FROM job_orders j
             JOIN vehicles v ON j.vehicleId = v.id
             LEFT JOIN users u ON j.mechanicId = u.id
             WHERE j.jobNumber = ? AND v.plateNumber = ?`,
            [jobNumber, plateNumber]
        );

        if (!job) {
            return res.status(404).json({ message: 'Job Order not found. Low match score.' });
        }

        // Check for invoice
        const invoice = await db.get('SELECT id, status FROM invoices WHERE jobOrderId = ?', [job.id]);

        res.json({
            jobNumber: job.jobNumber,
            status: job.status,
            priority: job.priority,
            vehicle: `${job.year} ${job.make} ${job.model} (${job.color})`,
            mechanic: job.mechanicName || 'Pending Assignment',
            lastUpdated: job.updatedAt,
            created: job.createdAt,
            isAppointment: false,
            invoiceId: invoice?.id,
            invoiceStatus: invoice?.status
        });

    } catch (error) {
        console.error('Track Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const db = await getDb();
        const [vehicles, parts, orders] = await Promise.all([
            db.get('SELECT COUNT(*) as count FROM vehicles'),
            db.get('SELECT COUNT(*) as count FROM parts'),
            db.get('SELECT COUNT(*) as count FROM job_orders WHERE status = \'COMPLETED\'')
        ]);

        res.json({
            vehicles: vehicles.count + 500,
            parts: parts.count,
            jobs: orders.count + 100
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
