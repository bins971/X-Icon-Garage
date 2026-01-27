const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const crypto = require('crypto');

// @route   GET /api/customers
router.get('/', protect, async (req, res) => {
    const db = await getDb();
    try {
        const customers = await db.all(`
            SELECT 
                id, 
                name, 
                email, 
                phone, 
                address, 
                profileimage as "profileImage", 
                userid as "userId", 
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM customers 
            ORDER BY createdat DESC
        `);
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/customers
router.post('/', protect, async (req, res) => {
    const { name, email, phone, address } = req.body;
    const db = await getDb();
    try {
        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO customers (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, phone, address]
        );
        const customer = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/customers/:id
router.get('/:id', protect, async (req, res) => {
    const db = await getDb();
    try {
        const customer = await db.get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (customer) {
            const vehicles = await db.all('SELECT * FROM vehicles WHERE customerid = ? ORDER BY createdat DESC', [req.params.id]);

            const jobOrders = await db.all(`
                SELECT jo.*, v.platenumber, v.make, v.model 
                FROM job_orders jo 
                JOIN vehicles v ON jo.vehicleid = v.id 
                WHERE jo.customerid = ? 
                ORDER BY jo.createdat DESC
            `, [req.params.id]);

            const invoices = await db.all(`
                SELECT i.*, jo.jobnumber 
                FROM invoices i 
                JOIN job_orders jo ON i.joborderid = jo.id 
                WHERE jo.customerid = ? 
                ORDER BY i.createdat DESC
            `, [req.params.id]);

            const appointments = await db.all(`
                SELECT * FROM appointments 
                WHERE (email = ? OR phone = ?) 
                ORDER BY createdat DESC
            `, [customer.email, customer.phone]);

            res.json({
                ...customer,
                vehicles,
                jobOrders,
                invoices,
                appointments
            });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
