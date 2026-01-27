const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const crypto = require('crypto');
const { validateCardNumber, validateGCashNumber, maskData } = require('../utils/paymentValidator');
const { protect, authorize } = require('../middleware/auth');

// @access  Public
router.get('/public/parts', async (req, res) => {
    try {
        const db = await getDb();
        const parts = await db.all(`
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
                image,
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM parts 
            WHERE ispublic = 1 AND quantity > 0
        `);
        res.json(parts);
    } catch (error) {
        console.error('Shop Parts Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Public
router.post('/public/order', async (req, res) => {
    const { customerName, email, phone, items, totalAmount, paymentMethod } = req.body;

    console.log('[ORDER] Received order request:', {
        customerName,
        email,
        phone,
        itemsCount: items?.length,
        totalAmount,
        paymentMethod,
        gcashNumber: req.body.gcashNumber,
        cardNumber: req.body.cardNumber
    });

    if (!customerName || !email || !items || items.length === 0) {
        console.log('[ORDER] Validation failed: Missing required fields');
        return res.status(400).json({ message: 'Invalid order data.' });
    }

    // Payment Validation
    if (paymentMethod === 'CARD' && !validateCardNumber(req.body.cardNumber || '')) {
        console.log('[ORDER] Card validation failed:', req.body.cardNumber);
        return res.status(400).json({ message: 'Invalid credit card number.' });
    }

    if (paymentMethod === 'GCASH' && !validateGCashNumber(req.body.gcashNumber || '')) {
        console.log('[ORDER] GCash validation failed:', req.body.gcashNumber);
        return res.status(400).json({ message: 'Invalid GCash phone number.' });
    }

    try {
        const db = await getDb();
        const id = crypto.randomUUID();
        await db.run(
            `INSERT INTO online_orders (id, customername, email, phone, items, totalamount, paymentmethod) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, customerName, email, phone, JSON.stringify(items), totalAmount, paymentMethod || 'CASH']
        );

        console.log('[ORDER] Order created successfully:', id);
        res.status(201).json({ message: 'Order placed successfully.', id });
    } catch (error) {
        console.error('[ORDER] Database error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Public
router.get('/public/order/:id', async (req, res) => {
    try {
        const db = await getDb();
        const order = await db.get(`
            SELECT 
                id, 
                customername as "customerName", 
                email, 
                phone, 
                items, 
                totalamount as "totalAmount", 
                paymentmethod as "paymentMethod",
                status, 
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM online_orders 
            WHERE id = ?
        `, [req.params.id]);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            ...order,
            items: JSON.parse(order.items)
        });
    } catch (error) {
        console.error('Get Order Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Private (Admin/Advisor)
router.get('/orders', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all(`
            SELECT 
                id, 
                customername as "customerName", 
                email, 
                phone, 
                items, 
                totalamount as "totalAmount", 
                paymentmethod as "paymentMethod",
                status, 
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM online_orders 
            ORDER BY createdat DESC
        `);
        const parsedOrders = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items)
        }));

        res.json(parsedOrders);
    } catch (error) {
        console.error('Get Orders Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Private (Admin/Advisor)
router.patch('/orders/:id', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        const db = await getDb();
        console.log(`[Shop] Updating order ${id} to status ${status}`);

        // Fetch order details for notification
        const order = await db.get('SELECT customername as "customerName", email FROM online_orders WHERE id = ?', [id]);

        await db.run(
            'UPDATE online_orders SET status = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        // Send Notification
        if (order && order.email) {
            try {
                const { logNotification } = require('../utils/notifier');
                let notifType = null;
                if (status === 'PROCESSED') notifType = 'ORDER_PROCESSED';
                if (status === 'COMPLETED') notifType = 'ORDER_SHIPPED'; // COMPLETED = Shipped/Done
                if (status === 'CANCELLED') notifType = 'ORDER_CANCELLED';

                if (notifType) {
                    await logNotification(notifType, order.email, {
                        customerName: order.customerName,
                        orderId: id.slice(0, 8).toUpperCase(), // Short ID
                        status
                    });
                }
            } catch (notifyErr) {
                console.warn('Order Notification Error:', notifyErr.message);
            }
        }

        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Update Order Error:', {
            message: error.message,
            id,
            status,
            code: error.code,
            detail: error.detail
        });
        res.status(500).json({
            message: 'Failed to update order status. See server logs for details.',
            error: error.message
        });
    }
});

module.exports = router;
