const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { sendPaymentConfirmation, sendTrackingNotification } = require('../services/emailService');

// @route   GET /admin/orders/pending-payment
// @desc    Get all orders awaiting payment confirmation
// @access  Private (Admin/Advisor)
router.get('/orders/pending-payment', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
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
                delivery_method as "deliveryMethod",
                shipping_address as "shippingAddress",
                shipping_city as "shippingCity",
                shipping_province as "shippingProvince",
                shipping_postal as "shippingPostal",
                tracking_number as "trackingNumber",
                courier_name as "courierName",
                status,
                createdat as "createdAt",
                updatedat as "updatedAt"
            FROM online_orders
            WHERE status IN ('PENDING', 'PENDING_PAYMENT', 'PROCESSING', 'SHIPPED')
            ORDER BY 
                CASE status
                    WHEN 'PENDING_PAYMENT' THEN 1
                    WHEN 'PENDING' THEN 2
                    WHEN 'PROCESSING' THEN 3
                    WHEN 'SHIPPED' THEN 4
                    ELSE 5
                END,
                createdat DESC
        `);

        const parsedOrders = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items)
        }));

        res.json(parsedOrders);
    } catch (error) {
        console.error('[ADMIN] Error fetching pending payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /admin/orders/:id/confirm-payment
// @desc    Confirm manual payment received
// @access  Private (Admin/Advisor)
router.post('/orders/:id/confirm-payment', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { id } = req.params;

    try {
        const db = await getDb();

        // Get order details
        const order = await db.get(`
            SELECT 
                id,
                customername as "customerName",
                email,
                totalamount as "totalAmount",
                paymentmethod as "paymentMethod",
                shipping_fee as "shippingFee",
                status
            FROM online_orders
            WHERE id = ?
        `, [id]);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PENDING') {
            return res.status(400).json({ message: 'Order is not awaiting confirmation' });
        }

        // Update order status to PROCESSING and set updatedat
        console.log(`[ADMIN] Confirming payment for order ${id}. Current Status: ${order.status}`);

        await db.run(`
            UPDATE online_orders
            SET status = 'PROCESSING', updatedat = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [id]);

        console.log(`[ADMIN] DB Status Updated for ${id}`);

        // Parse items from JSON string
        let items = [];
        try {
            items = order.items ? JSON.parse(order.items) : [];
        } catch (e) {
            console.error('[ADMIN] JSON Parse Error for items:', e.message, order.items);
            // Continue with empty items if parse fails
        }

        // Send confirmation email
        try {
            const isCash = order.paymentMethod === 'CASH' || order.paymentMethod === 'COD';

            console.log('[ADMIN] Sending confirmation email...');
            // Send Email with full receipt details
            await sendPaymentConfirmation({
                orderId: id,
                customerName: order.customerName,
                email: order.email,
                items: items,
                totalAmount: order.totalAmount,
                shippingFee: order.shippingFee,
                paymentMethod: order.paymentMethod
            });
            console.log('[ADMIN] Email sent successfully');

        } catch (emailError) {
            console.warn('[ADMIN] Failed to send payment confirmation email:', emailError.message);
        }

        res.json({ message: 'Payment confirmed successfully' });
    } catch (error) {
        console.error('[ADMIN] Error confirming payment CRITICAL:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PATCH /admin/orders/:id/tracking
// @desc    Update tracking number and courier for an order
// @access  Private (Admin/Advisor)
// @route   PATCH /admin/orders/:id/tracking
// @desc    Update tracking number and courier for an order
// @access  Private (Admin/Advisor)
router.patch('/orders/:id/tracking', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    try {
        const { id } = req.params;
        const { trackingNumber, courierName } = req.body;

        if (!trackingNumber || !courierName) {
            return res.status(400).json({ message: 'Tracking number and courier name are required.' });
        }

        const db = await getDb();

        // Update tracking info and status to SHIPPED
        await db.run(
            `UPDATE online_orders 
             SET tracking_number = ?, courier_name = ?, status = 'SHIPPED', updatedat = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [trackingNumber, courierName, id]
        );

        // Fetch order details for email (Including full items and payment info)
        const order = await db.get(`
            SELECT 
                id, 
                customername, 
                email, 
                items, 
                totalamount, 
                paymentmethod, 
                shipping_fee 
            FROM online_orders 
            WHERE id = ?
        `, [id]);

        if (order && order.email) {
            let items = [];
            try {
                items = order.items ? JSON.parse(order.items) : [];
            } catch (e) {
                console.error('[ADMIN] JSON Parse Error for items in tracking:', e.message);
            }

            // Send tracking email with full receipt details
            sendTrackingNotification({
                orderId: order.id,
                customerName: order.customername,
                email: order.email,
                courierName,
                trackingNumber,
                items: items,
                totalAmount: order.totalamount,
                shippingFee: order.shipping_fee,
                paymentMethod: order.paymentmethod
            }).catch(err => console.error('[EMAIL] Tracking notification failed:', err.message));
        }

        res.json({ message: 'Tracking information updated' });
    } catch (error) {
        console.error('Update Tracking Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   PATCH /admin/orders/:id
// @desc    Update order status (generic)
// @access  Private (Admin/Advisor)
// @route   GET /orders
// @desc    Get all orders (with optional archive filter)
// @access  Private (Admin/Advisor)
router.get('/orders', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    try {
        const db = await getDb();
        const showArchived = req.query.archived === 'true';

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
                isArchived,
                createdat as "createdAt", 
                updatedat as "updatedAt" 
            FROM online_orders 
            WHERE isArchived = ?
            ORDER BY createdat DESC
        `, [showArchived ? 1 : 0]);

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

// @route   PATCH /orders/:id
// @desc    Update order status or archive state
// @access  Private (Admin/Advisor)
router.patch('/orders/:id', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { id } = req.params;
    const { status, isArchived } = req.body;

    const db = await getDb();

    // Start Transaction
    await db.exec('BEGIN');

    try {
        const order = await db.get('SELECT * FROM online_orders WHERE id = ?', [id]);
        if (!order) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ message: 'Order not found' });
        }

        // Handle Archive Toggle
        if (isArchived !== undefined) {
            await db.run(
                'UPDATE online_orders SET isArchived = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?',
                [isArchived ? 1 : 0, id]
            );
            await db.exec('COMMIT');
            return res.json({ message: `Order ${isArchived ? 'archived' : 'restored'} successfully` });
        }

        // Restock Logic if CANCELLED
        if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
            console.log(`[ADMIN] Restocking items for cancelled order ${id}`);
            let items = [];
            try {
                items = JSON.parse(order.items);
            } catch (e) {
                console.error('[ADMIN] Failed to parse items for restocking:', e);
            }

            for (const item of items) {
                await db.run('UPDATE parts SET quantity = quantity + ? WHERE id = ?', [item.qty, item.id]);
            }
        }

        // Update order status
        if (status) {
            await db.run(
                `UPDATE online_orders SET status = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?`,
                [status, req.params.id]
            );
        }

        await db.exec('COMMIT');

        // Send Email Notification for Completed/Picked Up
        if (order.email && status === 'COMPLETED' && order.delivery_method !== 'DELIVERY') {
            try {
                // Send "Order Completed" / "Payment Received" email
                await sendPaymentConfirmation({
                    orderId: id,
                    customerName: order.customername,
                    email: order.email,
                    totalAmount: order.totalamount,
                    type: 'PAYMENT_RECEIVED' // When marked as completed, we assume money is collected
                });
            } catch (err) {
                console.warn('[ADMIN] Failed to send completion email:', err.message);
            }
        }

        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('[ADMIN] Update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
