const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const crypto = require('crypto');

// @route   GET /api/job-orders
router.get('/', protect, async (req, res) => {
    const { status, mechanicId, priority, customerId, isArchived } = req.query;
    const db = await getDb();

    let query = `
        SELECT 
            jo.*, 
            jo.jobnumber as "jobNumber",
            jo.estimatedcost as "estimatedCost",
            jo.estimatedtime as "estimatedTime",
            jo.customerid as "customerId",
            jo.vehicleid as "vehicleId",
            jo.mechanicid as "mechanicId",
            jo.createdat as "createdAt",
            jo.updatedat as "updatedAt",
            c.name as "customerName", 
            v.platenumber as "plateNumber", 
            v.make, 
            v.model, 
            u.name as "mechanicName"
        FROM job_orders jo
        LEFT JOIN customers c ON jo.customerid = c.id
        LEFT JOIN vehicles v ON jo.vehicleid = v.id
        LEFT JOIN users u ON jo.mechanicid = u.id
        WHERE 1=1
    `;

    const params = [];

    if (isArchived === 'true') {
        query += ' AND jo.isarchived = 1 ';
    } else {
        query += ' AND (jo.isarchived = 0 OR jo.isarchived IS NULL) ';
    }

    if (req.user.role === 'CUSTOMER') {
        query += ' AND c.userId = ? ';
        params.push(req.user.id);
    }

    if (status) { query += ` AND jo.status = ?`; params.push(status); }
    if (mechanicId) { query += ` AND jo.mechanicid = ?`; params.push(mechanicId); }
    if (priority) { query += ` AND jo.priority = ?`; params.push(priority); }
    if (customerId) { query += ` AND jo.customerid = ?`; params.push(customerId); }

    query += ` ORDER BY jo.createdat DESC`;

    try {
        const jobs = await db.all(query, params);
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a job order
// @route   POST /api/job-orders
router.post('/', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { customerId, vehicleId, complaint, estimatedCost, estimatedTime, priority, notes } = req.body;
    const db = await getDb();
    try {
        const id = crypto.randomUUID();
        const jobNumber = `JO-${Date.now().toString().slice(-6)}`;

        await db.run(
            'INSERT INTO job_orders (id, jobnumber, customerid, vehicleid, complaint, estimatedcost, estimatedtime, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, jobNumber, customerId, vehicleId, complaint, estimatedCost, estimatedTime, 'RECEIVED', priority || 'NORMAL', notes]
        );

        await logActivity(req.user.id, 'CREATE', 'JOB_ORDER', id, `Created JO: ${jobNumber} (${priority || 'NORMAL'})`);

        // Fetch details for notification
        const details = await db.get(`
            SELECT c.name, c.email, v.make, v.model, v.platenumber 
            FROM customers c 
            JOIN vehicles v ON v.customerid = c.id
            WHERE c.id = ? AND v.id = ?
        `, [customerId, vehicleId]);

        if (details) {
            const { logNotification } = require('../utils/notifier');
            await logNotification('JOB_ORDER_CREATED', details.email, {
                customerName: details.name,
                jobNumber,
                vehicle: `${details.make} ${details.model}`,
                plateNumber: details.platenumber
            });
        }

        const job = await db.get(`
            SELECT 
                *,
                jobnumber as "jobNumber",
                customerid as "customerId",
                vehicleid as "vehicleId",
                mechanicid as "mechanicId",
                estimatedcost as "estimatedCost",
                estimatedtime as "estimatedTime",
                isarchived as "isArchived",
                createdat as "createdAt",
                updatedat as "updatedAt"
            FROM job_orders 
            WHERE id = ?
        `, [id]);
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Archive/Delete job order
// @route   DELETE /api/job-orders/:id
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
    const db = await getDb();
    try {
        await db.run('UPDATE job_orders SET isarchived = 1 WHERE id = ?', [req.params.id]);
        await logActivity(req.user.id, 'ARCHIVE', 'JOB_ORDER', req.params.id, 'Archived job order');
        res.json({ message: 'Job order archived' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update JO status
// @route   PATCH /api/job-orders/:id/status
router.patch('/:id/status', protect, async (req, res) => {
    const { status } = req.body;
    const db = await getDb();
    try {
        await db.run(
            'UPDATE job_orders SET status = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?',
            [status, req.params.id]
        );

        await logActivity(req.user.id, 'UPDATE_STATUS', 'JOB_ORDER', req.params.id, `Status changed to: ${status}`);

        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Assign mechanic to job
// @route   PATCH /api/job-orders/:id/assign
router.patch('/:id/assign', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { mechanicId } = req.body;
    const db = await getDb();
    try {
        await db.run(
            'UPDATE job_orders SET mechanicid = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?',
            [mechanicId, req.params.id]
        );

        await logActivity(req.user.id, 'ASSIGN_MECHANIC', 'JOB_ORDER', req.params.id, `Assigned mechanic: ${mechanicId}`);

        res.json({ message: 'Mechanic assigned' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
