const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

router.get('/', protect, async (req, res) => {
    const db = await getDb();
    try {
        let query = `
            SELECT 
                v.id, 
                v.vin, 
                v.platenumber as "plateNumber", 
                v.make, 
                v.model, 
                v.year, 
                v.color, 
                v.customerid as "customerId", 
                v.createdat as "createdAt", 
                v.updatedat as "updatedAt",
                c.name as "customerName" 
            FROM vehicles v 
            JOIN customers c ON v.customerid = c.id 
        `;
        let params = [];

        if (req.user.role === 'CUSTOMER') {
            query += ' WHERE c.userid = ? ';
            params.push(req.user.id);
        }

        query += ' ORDER BY v.createdat DESC';

        const vehicles = await db.all(query, params);
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    let { vin, plateNumber, make, model, year, color, customerId } = req.body;
    const db = await getDb();


    try {
        if (req.user.role && req.user.role.toUpperCase() === 'CUSTOMER') {
            let customer = await db.get('SELECT id FROM customers WHERE userid = ?', [req.user.id]);

            if (!customer) {
                console.log(`[Vehicle] No customer record found for user ${req.user.id}. Creating one...`);
                const newCustomerId = crypto.randomUUID();
                const email = req.user.username && req.user.username.includes('@') ? req.user.username : '';

                await db.run(
                    'INSERT INTO customers (id, name, phone, email, userid) VALUES (?, ?, ?, ?, ?)',
                    [newCustomerId, req.user.name || 'Customer', '', email, req.user.id]
                );
                customer = { id: newCustomerId };
            }
            customerId = customer.id;
        }

        if (!customerId) {
            return res.status(400).json({ message: 'Customer ID is required' });
        }

        const id = crypto.randomUUID();
        await db.run(
            'INSERT INTO vehicles (id, vin, platenumber, make, model, year, color, customerid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, vin, plateNumber, make, model, year, color, customerId]
        );
        const vehicle = await db.get(`
            SELECT 
                id, 
                vin, 
                platenumber as "plateNumber", 
                make, 
                model, 
                year, 
                color, 
                customerid as "customerId", 
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM vehicles WHERE id = ?
        `, [id]);
        res.status(201).json(vehicle);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key value')) {
            return res.status(400).json({ message: 'VIN or Plate Number already exists' });
        }
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    const { vin, plateNumber, make, model, year, color } = req.body;
    const db = await getDb();
    try {
        const vehicle = await db.get('SELECT v.*, c.userid FROM vehicles v JOIN customers c ON v.customerid = c.id WHERE v.id = ?', [req.params.id]);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        if (req.user.role === 'CUSTOMER' && vehicle.userid !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await db.run(
            'UPDATE vehicles SET vin = ?, platenumber = ?, make = ?, model = ?, year = ?, color = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?',
            [vin, plateNumber, make, model, year, color, req.params.id]
        );
        res.json({ message: 'Vehicle updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    const db = await getDb();
    try {
        const vehicle = await db.get('SELECT v.*, c.userid FROM vehicles v JOIN customers c ON v.customerid = c.id WHERE v.id = ?', [req.params.id]);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        if (req.user.role === 'CUSTOMER' && vehicle.userid !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
        res.json({ message: 'Vehicle removed from garage' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
