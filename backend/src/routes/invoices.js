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

        // Start Transaction
        await db.exec('BEGIN');

        try {
            await db.run(
                'INSERT INTO job_order_parts (id, joborderid, partid, quantity, unitprice) VALUES (?, ?, ?, ?, ?)',
                [id, req.params.id, partId, quantity, part.sellingPrice]
            );

            // Deduct from inventory
            await db.run('UPDATE parts SET quantity = quantity - ? WHERE id = ?', [quantity, partId]);

            await db.exec('COMMIT'); // Commit transaction

            await logActivity(req.user.id, 'ADD_PART', 'JOB_ORDER', req.params.id, `Added ${quantity} of ${part.name}`);

            res.status(201).json({ message: 'Part added to job' });
        } catch (err) {
            await db.exec('ROLLBACK');
            throw err;
        }
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

        // Fetch customer and job details for notification
        const details = await db.get(`
            SELECT c.name as customerName, c.email, jo.jobnumber as "jobNumber"
            FROM job_orders jo
            JOIN customers c ON jo.customerid = c.id
            WHERE jo.id = ?
        `, [jobOrderId]);

        if (details && details.email) {
            const { logNotification } = require('../utils/notifier');
            await logNotification('INVOICE_GENERATED', details.email, {
                customerName: details.customerName,
                invoiceNumber: invoiceNumber,
                totalAmount: `₱${totalAmount.toLocaleString()}`,
                jobNumber: details.jobNumber,
                invoiceId: id
            });
        }

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
                c.id as "customerId",
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
            SELECT 
                i.id, 
                i.invoicenumber as "invoiceNumber", 
                i.totalamount as "totalAmount", 
                i.subtotal as "subTotal", 
                i.discount, 
                i.tax, 
                i.status, 
                i.joborderid as "jobOrderId",
                jo.jobnumber as "jobNumber", 
                c.id as "customerId",
                c.name as "customerName", 
                c.email, 
                c.phone, 
                c.address, 
                v.make, 
                v.model, 
                v.platenumber as "plateNumber"
            FROM invoices i
            JOIN job_orders jo ON i.joborderid = jo.id
            JOIN customers c ON jo.customerid = c.id
            JOIN vehicles v ON jo.vehicleid = v.id
            WHERE i.id = ?
        `, [req.params.id]);

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const parts = await db.all(`
            SELECT jop.*, p.name as "partName", jop.unitprice as "unitPrice"
            FROM job_order_parts jop
            JOIN parts p ON jop.partid = p.id
            WHERE jop.joborderid = ?
        `, [invoice.jobOrderId]);

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
        const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const currentPayments = await db.get('SELECT SUM(amount) as totalpaid FROM payments WHERE invoiceid = ?', [req.params.id]);
        const totalPaidSoFar = parseFloat(currentPayments.totalpaid || 0);
        const invoiceTotal = parseFloat(invoice.totalamount || 0);
        const remaining = invoiceTotal - totalPaidSoFar;

        if (amount <= 0) {
            return res.status(400).json({ message: 'Payment amount must be greater than zero.' });
        }

        if (amount > remaining + 0.01) { // Floating point tolerance
            return res.status(400).json({ message: `Overpayment detected. Remaining balance is ₱${remaining.toLocaleString()}` });
        }

        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO payments (id, invoiceid, amount, paymentmethod) VALUES (?, ?, ?, ?)',
            [id, req.params.id, amount, paymentMethod]
        );

        // Re-fetch for status update (using the values we already have + new amount is safer, but db fetch ensures consistency)
        const payments = await db.get('SELECT SUM(amount) as totalpaid FROM payments WHERE invoiceid = ?', [req.params.id]);

        const totalPaid = parseFloat(payments.totalpaid || 0);
        const totalAmount = parseFloat(invoice.totalamount || 0);

        let status = 'PARTIAL';
        if (totalPaid >= totalAmount - 0.01) { // Floating point tolerance
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
