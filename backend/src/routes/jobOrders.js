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
            u.name as "mechanicName",
            i.id as "invoiceId",
            i.status as "invoiceStatus"
        FROM job_orders jo
        LEFT JOIN customers c ON jo.customerid = c.id
        LEFT JOIN vehicles v ON jo.vehicleid = v.id
        LEFT JOIN users u ON jo.mechanicid = u.id
        LEFT JOIN invoices i ON i.joborderid = jo.id
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
    console.log('[CreateJob] Request:', req.body);
    const db = await getDb();
    try {
        const id = crypto.randomUUID();
        const jobNumber = `JO-${Date.now().toString().slice(-6)}`;
        console.log('[CreateJob] Inserting job:', id, jobNumber);

        await db.run(
            'INSERT INTO job_orders (id, jobnumber, customerid, vehicleid, complaint, estimatedcost, estimatedtime, status, priority, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, jobNumber, customerId, vehicleId, complaint, estimatedCost || null, estimatedTime, 'RECEIVED', priority || 'NORMAL', notes]
        );
        console.log('[CreateJob] Job inserted');

        await logActivity(req.user.id, 'CREATE', 'JOB_ORDER', id, `Created JO: ${jobNumber} (${priority || 'NORMAL'})`);
        console.log('[CreateJob] Activity logged');

        // Fetch details for notification
        const details = await db.get(`
            SELECT c.name, c.email, v.make, v.model, v.platenumber 
            FROM customers c 
            JOIN vehicles v ON v.customerid = c.id
            WHERE c.id = ? AND v.id = ?
        `, [customerId, vehicleId]);
        console.log('[CreateJob] Details fetched:', details);

        if (details) {
            try {
                const { logNotification } = require('../utils/notifier');
                await logNotification('JOB_ORDER_CREATED', details.email, {
                    customerName: details.name,
                    jobNumber,
                    vehicle: `${details.make} ${details.model}`,
                    plateNumber: details.platenumber
                });
                console.log('[CreateJob] Notification logged');
            } catch (notifyErr) {
                console.error('[CreateJob] Notification failed:', notifyErr);
            }
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
        console.error('[CreateJob] Error:', error);
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

        // Notify Customer
        const details = await db.get(`
            SELECT c.name, c.email, v.make, v.model, jo.jobnumber 
            FROM job_orders jo
            JOIN customers c ON jo.customerid = c.id
            JOIN vehicles v ON jo.vehicleid = v.id
            WHERE jo.id = ?
        `, [req.params.id]);

        if (details) {
            console.log(`[StatusUpdate] Notification logic triggered for ${details.email}`);
            const { logNotification } = require('../utils/notifier');
            // If status is COMPLETED, Use JOB_READY, otherwise JOB_STATUS_UPDATED
            const type = status === 'COMPLETED' ? 'JOB_READY' : 'JOB_STATUS_UPDATED';

            try {
                await logNotification(type, details.email, {
                    customerName: details.name,
                    jobNumber: details.jobnumber || details.jobNumber,
                    vehicle: `${details.make} ${details.model}`,
                    status: status,
                    totalAmount: 'Calculated upon release' // Placeholder for now
                });
                console.log(`[StatusUpdate] Notification sent to ${details.email}`);
            } catch (notifyError) {
                console.error(`[StatusUpdate] Notification failed:`, notifyError);
            }
        } else {
            console.log(`[StatusUpdate] No customer details found for Job ID: ${req.params.id}`);
        }

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

// @route   GET /api/job-orders/:id/parts
router.get('/:id/parts', protect, async (req, res) => {
    const db = await getDb();
    try {
        const parts = await db.all(`
            SELECT jop.*, p.name, p.partnumber as "partNumber"
            FROM job_order_parts jop
            JOIN parts p ON jop.partid = p.id
            WHERE jop.joborderid = ?
        `, [req.params.id]);
        res.json(parts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
