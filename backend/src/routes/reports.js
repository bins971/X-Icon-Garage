const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');


// @route   GET /api/reports/dashboard
router.get('/dashboard', protect, async (req, res) => {
    const db = await getDb();
    try {
        const revenueChart = await db.all(`
            SELECT TO_CHAR(date, 'YYYY-MM') as "month", COALESCE(SUM(revenue), 0) as "revenue"
            FROM (
                SELECT createdAt as date, amount as revenue FROM payments
                UNION ALL
                SELECT createdAt as date, totalAmount as revenue FROM online_orders
            ) combined
            GROUP BY 1
            ORDER BY 1 DESC
            LIMIT 6
        `);

        const jobStatus = await db.all(`
            SELECT status, COUNT(*) as "count" 
            FROM job_orders 
            WHERE isarchived = 0 OR isarchived IS NULL 
            GROUP BY status
        `);

        const mechanicStats = await db.all(`
            SELECT u.name, COUNT(jo.id) as "jobsCompleted"
            FROM job_orders jo
            JOIN users u ON jo.mechanicid = u.id
            WHERE jo.status = 'COMPLETED' 
            AND TO_CHAR(jo.updatedat, 'YYYY-MM') = TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM')
            GROUP BY u.name
        `);

        const onlineOrdersCount = await db.get('SELECT COUNT(*) as "count" FROM online_orders');

        res.json({
            revenueChart: revenueChart.reverse(),
            jobStatus,
            mechanicStats,
            onlineOrders: onlineOrdersCount.count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/reports/export/revenue
router.get('/export/revenue', protect, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
    const db = await getDb();
    try {
        const payments = await db.all(`
            SELECT p.id, p.amount, p.paymentMethod, p.createdAt, i.invoiceNumber, c.name as customer
            FROM payments p
            JOIN invoices i ON p.invoiceId = i.id
            JOIN job_orders jo ON i.jobOrderId = jo.id
            JOIN customers c ON jo.customerId = c.id
            ORDER BY p.createdAt DESC
        `);

        const csvHeader = 'Payment ID,Amount,Method,Date,Invoice #,Customer\n';
        const csvRows = payments.map(p =>
            `${p.id},${p.amount},${p.paymentMethod},${new Date(p.createdAt).toISOString()},${p.invoiceNumber},"${p.customer}"`
        ).join('\n');

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="revenue_report.csv"');
        res.send(csvHeader + csvRows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/reports/revenue
router.get('/revenue', protect, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
    const db = await getDb();
    try {
        const daily = await db.all(`
            SELECT createdAt::DATE as date, SUM(amount) as total 
            FROM payments 
            GROUP BY date 
            ORDER BY date DESC LIMIT 30
        `);
        const total = await db.get(`
            SELECT (
                (SELECT COALESCE(SUM(amount), 0) FROM payments) + 
                (SELECT COALESCE(SUM(totalamount), 0) FROM online_orders)
            ) as "total"
        `);
        res.json({ daily, total: total.total || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/reports/stock-alerts
router.get('/stock-alerts', protect, async (req, res) => {
    const db = await getDb();
    try {
        const alerts = await db.all(`
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
            WHERE quantity <= minthreshold
        `);
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/reports/wallet
router.get('/wallet', protect, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
    const db = await getDb();
    try {
        // 1. Total Online Earnings
        const earnings = await db.get('SELECT COALESCE(SUM(totalAmount), 0) as total FROM online_orders WHERE status != \'CANCELLED\'');

        // 2. Total Withdrawn
        const withdrawn = await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM store_payouts');

        const totalEarnings = earnings.total;
        const totalWithdrawn = withdrawn.total;
        const availableBalance = totalEarnings - totalWithdrawn;

        // 3. Recent Payouts
        const payouts = await db.all(`
            SELECT 
                id, 
                amount, 
                method, 
                accountnumber as "accountNumber", 
                processedBy as "processedBy",
                status,
                createdat as "createdAt"
            FROM store_payouts 
            ORDER BY createdat DESC 
            LIMIT 5
        `);

        res.json({
            totalEarnings,
            totalWithdrawn,
            availableBalance,
            payouts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/reports/activity
router.get('/activity', protect, async (req, res) => {
    const db = await getDb();
    try {
        // 1. Fetch recent jobs (with details)
        const recentJobs = await db.all(`
            SELECT 
                j.id, j.jobnumber as "jobNumber", j.status, j.priority, j.createdat as "createdAt", j.updatedat as "updatedAt",
                c.id as "customerId",
                c.name as "customerName",
                v.make, v.model,
                u.name as "mechanicName"
            FROM job_orders j
            LEFT JOIN customers c ON j.customerid = c.id
            LEFT JOIN vehicles v ON j.vehicleid = v.id
            LEFT JOIN users u ON j.mechanicid = u.id
            ORDER BY j.updatedat DESC
            LIMIT 10
        `);

        // 2. Fetch recent payouts
        const recentPayouts = await db.all(`
            SELECT id, amount, method, accountnumber as "accountNumber", createdat as "createdAt", 'COMPLETED' as "status"
            FROM store_payouts
            ORDER BY createdat DESC
            LIMIT 10
        `);

        // 3. Normalize & Merge
        const activities = [
            ...recentJobs.map(job => ({
                id: job.id,
                type: 'JOB',
                title: job.jobNumber,
                subtitle: `${job.make} ${job.model} • ${job.customerName}`,
                status: job.status,
                priority: job.priority,
                amount: null,
                detail: job.mechanicName || 'Unassigned',
                timestamp: job.updatedAt
            })),
            ...recentPayouts.map(payout => ({
                id: payout.id,
                type: 'PAYOUT',
                title: `TRANSFER: ${payout.method}`,
                subtitle: `To: ${payout.accountNumber}`,
                status: 'COMPLETED',
                priority: 'HIGH',
                amount: payout.amount,
                detail: 'Approved by Admin',
                timestamp: payout.createdAt
            }))
        ];

        // 4. Sort and Limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(activities.slice(0, 10));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const { logActivity } = require('../utils/logger');

router.post('/verify-pin', protect, authorize('ADMIN'), async (req, res) => {
    const { pin } = req.body;
    const db = await getDb();
    try {
        const user = await db.get('SELECT securityPin FROM users WHERE id = ?', [req.user.id]);
        const storedPin = user?.securityPin || user?.securitypin;

        if (!storedPin) return res.status(403).json({ message: 'No PIN set' });

        const isMatch = await require('bcryptjs').compare(pin, storedPin);
        if (!isMatch) {
            await logActivity(req.user.id, 'VERIFY_PIN_FAIL', 'USER', req.user.id, 'Failed PIN verification attempt');
            return res.status(401).json({ message: 'Invalid PIN' });
        }

        await logActivity(req.user.id, 'VERIFY_PIN_SUCCESS', 'USER', req.user.id, 'Successful PIN verification');
        res.json({ message: 'PIN Verified' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/reports/payout
router.post('/payout', protect, authorize('ADMIN'), async (req, res) => {
    const { amount, method, accountNumber, pin } = req.body;
    const db = await getDb();
    try {
        // 1. Verify Security PIN
        const user = await db.get('SELECT securityPin FROM users WHERE id = ?', [req.user.id]);
        const storedPin = user?.securityPin || user?.securitypin;

        // Fail-safe for this demo: if no pin is set, we treat '123456' as the default requirement but we need to hash it? 
        // Actually, let's enforce db check.
        if (!storedPin) {
            return res.status(403).json({ message: 'Security PIN not configured for this account.' });
        }

        const isMatch = await require('bcryptjs').compare(pin, storedPin);
        if (!isMatch) {
            await logActivity(req.user.id, 'PAYOUT_FAIL', 'USER', req.user.id, 'Unauthorized payout attempt: Invalid PIN');
            return res.status(401).json({ message: 'Incorrect Security PIN. Transaction denied.' });
        }

        // 2. Check balance
        const earnings = await db.get('SELECT COALESCE(SUM(totalAmount), 0) as total FROM online_orders WHERE status != \'CANCELLED\'');
        const withdrawn = await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM store_payouts');
        const available = earnings.total - withdrawn.total;

        if (amount <= 0 || amount > available) {
            await logActivity(req.user.id, 'PAYOUT_FAIL', 'USER', req.user.id, `Insufficient funds or invalid amount: ${amount}`);
            return res.status(400).json({ message: 'Insufficient funds or invalid amount' });
        }

        const id = require('crypto').randomUUID();
        await db.run(
            'INSERT INTO store_payouts (id, amount, method, accountNumber, processedBy) VALUES (?, ?, ?, ?, ?)',
            [id, amount, method, accountNumber, req.user.id]
        );

        await logActivity(req.user.id, 'PAYOUT_SUCCESS', 'STORE_PAYOUT', id, `Withdrawal of ₱${amount} processed via ${method}`);
        res.json({ message: 'Withdrawal successful', remainingBalance: available - amount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
