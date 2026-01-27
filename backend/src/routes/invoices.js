const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const crypto = require('crypto');

// @route   POST /api/job-orders/:id/parts
router.post('/:id/parts', protect, async (req, res) => {
    const { partId, quantity } = req.body;
    const db = await getDb();
    try {
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
        `, [partId]);
        if (!part) return res.status(404).json({ message: 'Part not found' });
        if (part.quantity < quantity) return res.status(400).json({ message: 'Insufficient stock' });

        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO job_order_parts (id, joborderid, partid, quantity, unitprice) VALUES (?, ?, ?, ?, ?)',
            [id, req.params.id, partId, quantity, part.sellingPrice]
        );

        // Deduct from inventory
        await db.run('UPDATE parts SET quantity = quantity - ? WHERE id = ?', [quantity, partId]);

        await logActivity(req.user.id, 'ADD_PART', 'JOB_ORDER', req.params.id, `Added ${quantity} of ${part.name}`);

        res.status(201).json({ message: 'Part added to job' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @route   POST /api/invoices
router.post('/', protect, authorize('ADMIN', 'ADVISOR', 'ACCOUNTANT'), async (req, res) => {
    const { jobOrderId, discount, tax } = req.body;
    const db = await getDb();
    try {
        const parts = await db.all('SELECT * FROM job_order_parts WHERE joborderid = ?', [jobOrderId]);
        const job = await db.get('SELECT * FROM job_orders WHERE id = ?', [jobOrderId]);

        let subTotal = parseFloat(job.estimatedcost) || 0;
        parts.forEach(p => { subTotal += (parseFloat(p.unitprice) * p.quantity); });

        const totalAmount = (subTotal - (parseFloat(discount) || 0)) + (parseFloat(tax) || 0);
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        const id = crypto.randomUUID();

        await db.run(
            'INSERT INTO invoices (id, invoicenumber, joborderid, totalamount, discount, tax, subtotal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, invoiceNumber, jobOrderId, totalAmount, discount || 0, tax || 0, subTotal, 'UNPAID']
        );

        await logActivity(req.user.id, 'GENERATE_INVOICE', 'INVOICE', id, `Generated invoice ${invoiceNumber}`);

        res.status(201).json({ id, invoiceNumber, totalAmount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @route   GET /api/invoices
router.get('/', protect, async (req, res) => {
    const db = await getDb();
    try {
        let query = `
            SELECT 
                i.id, 
                i.invoicenumber as "invoiceNumber", 
                i.totalamount as "totalAmount", 
                i.subtotal as "subTotal", 
                i.discount, 
                i.tax, 
                i.status, 
                i.joborderid as "jobOrderId", 
                i.createdat as "createdAt", 
                i.updatedat as "updatedAt",
                jo.jobnumber as "jobNumber", 
                c.name as "customerName", 
                v.platenumber as "plateNumber"
            FROM invoices i
            JOIN job_orders jo ON i.joborderid = jo.id
            JOIN customers c ON jo.customerid = c.id
            JOIN vehicles v ON jo.vehicleid = v.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role === 'CUSTOMER') {
            query += ' AND c.userid = ?';
            params.push(req.user.id);
        }

        const invoices = await db.all(query + ' ORDER BY i.createdat DESC', params);
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @route   GET /api/invoices/:id
router.get('/:id', protect, async (req, res) => {
    const db = await getDb();
    try {
        const invoice = await db.get(`
            SELECT i.*, jo.jobnumber as "jobNumber", c.name as "customerName", c.email, c.phone, c.address, v.make, v.model, v.platenumber as "plateNumber"
            FROM invoices i
            JOIN job_orders jo ON i.joborderid = jo.id
            JOIN customers c ON jo.customerid = c.id
            JOIN vehicles v ON jo.vehicleid = v.id
            WHERE i.id = ?
        `, [req.params.id]);

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const parts = await db.all('SELECT * FROM job_order_parts WHERE joborderid = ?', [invoice.joborderid]);
        const payments = await db.all('SELECT * FROM payments WHERE invoiceid = ?', [req.params.id]);

        res.json({ ...invoice, parts, payments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/invoices/:id/payments
router.post('/:id/payments', protect, async (req, res) => {
    const { amount, paymentMethod } = req.body;
    const db = await getDb();
    try {
        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO payments (id, invoiceid, amount, paymentmethod) VALUES (?, ?, ?, ?)',
            [id, req.params.id, amount, paymentMethod]
        );

        const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
        const payments = await db.get('SELECT SUM(amount) as totalpaid FROM payments WHERE invoiceid = ?', [req.params.id]);

        let status = 'PARTIAL';
        if (parseFloat(payments.totalpaid) >= parseFloat(invoice.totalamount)) {
            status = 'PAID';
        }

        await db.run('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);

        const details = await db.get(`
            SELECT c.name, c.email, i.invoicenumber as "invoiceNumber", i.id as invoiceId
            FROM invoices i
            JOIN job_orders jo ON i.joborderid = jo.id
            JOIN customers c ON jo.customerid = c.id
            WHERE i.id = ?
        `, [req.params.id]);

        if (details) {
            const { logNotification } = require('../utils/notifier');
            await logNotification('PAYMENT_RECEIVED', details.email, {
                customerName: details.name,
                invoiceNumber: details.invoiceNumber,
                amount,
                status,
                invoiceId: details.invoiceId
            });
        }

        res.status(201).json({ message: 'Payment recorded', status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
