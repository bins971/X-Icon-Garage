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
            WHERE ispublic = 1 AND quantity > 0 AND (isArchived = 0 OR isArchived IS NULL)
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

    // Payment Validation - Skip for manual payment methods
    const manualPaymentMethods = ['BANK_TRANSFER', 'GCASH_MANUAL', 'PAYMAYA'];

    if (paymentMethod === 'CARD' && !validateCardNumber(req.body.cardNumber || '')) {
        console.log('[ORDER] Card validation failed:', req.body.cardNumber);
        return res.status(400).json({ message: 'Invalid credit card number.' });
    }

    if (paymentMethod === 'GCASH' && !validateGCashNumber(req.body.gcashNumber || '')) {
        console.log('[ORDER] GCash validation failed:', req.body.gcashNumber);
        return res.status(400).json({ message: 'Invalid GCash phone number.' });
    }

    // Add Labor Service Item if requested
    if (req.body.includeLabor) {
        items.push({
            id: 'SERVICE-LABOR',
            name: 'Labor & Professional Inspection',
            qty: 1,
            price: 500
        });
    }

    const db = await getDb();

    // Start Transaction
    await db.exec('BEGIN');

    try {
        const id = crypto.randomUUID();
        const paymentConfig = require('../config/payment');

        // Calculate shipping fee logic
        let finalShippingFee = 0;
        const deliveryMethod = req.body.deliveryMethod || 'PICKUP';

        // 1. Validate & Deduct Inventory (Critical Strict Check)
        let calculatedSubtotal = 0;

        for (const item of items) {
            // Fetch current stock with row lock in Postgres (FOR UPDATE) if wrapper supported it, 
            // but standard SELECT is okay if we do atomic UPDATE with WHERE check.
            const part = await db.get('SELECT * FROM parts WHERE id = ?', [item.id]);

            if (!part) {
                throw new Error(`Part not found: ${item.name}`);
            }

            if (part.quantity < item.qty) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${part.quantity}, Requested: ${item.qty}`);
            }

            // Handle casing differences between DB drivers (Postgres returns lowercase keys for unquoted identifiers)
            const isPublic = part.isPublic !== undefined ? part.isPublic : part.ispublic;

            if (!isPublic) {
                throw new Error(`Part ${item.name} is no longer available for sale.`);
            }

            // Deduct Stock immediately
            const result = await db.run(
                'UPDATE parts SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
                [item.qty, item.id, item.qty]
            );

            if (result.changes === 0) {
                throw new Error(`Stock concurrency error for ${item.name}. Please try again.`);
            }

            calculatedSubtotal += (Number(part.sellingPrice) * Number(item.qty));
        }

        if (deliveryMethod === 'DELIVERY') {
            // Free shipping logic based on ITEM TOTAL (Subtotal)
            if (calculatedSubtotal >= paymentConfig.shipping.freeShippingThreshold) {
                finalShippingFee = 0;
            } else {
                finalShippingFee = paymentConfig.shipping.flatRate;
            }
            console.log(`[ORDER] Shipping Calc: Subtotal ${calculatedSubtotal} -> Fee ${finalShippingFee}`);
        }

        // ENFORCE SERVER-SIDE TOTAL CALCULATION
        const finalTotalAmount = calculatedSubtotal + finalShippingFee;

        let initialStatus = 'PENDING';
        if (manualPaymentMethods.includes(paymentMethod)) {
            initialStatus = 'PENDING_PAYMENT';
        }

        await db.run(
            `INSERT INTO online_orders (
                id, customername, email, phone, items, totalamount, paymentmethod, status,
                delivery_method, shipping_address, shipping_city, shipping_province, shipping_postal, shipping_fee,
                createdat, updatedat
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
                id, customerName, email, phone, JSON.stringify(items), finalTotalAmount, paymentMethod || 'CASH', initialStatus,
                deliveryMethod,
                req.body.shippingAddress || null,
                req.body.shippingCity || null,
                req.body.shippingProvince || null,
                req.body.shippingPostal || null,
                finalShippingFee
            ]
        );

        // Commit Transaction
        await db.exec('COMMIT');

        console.log('[ORDER] Order created successfully:', id, 'Status:', initialStatus);

        // Send payment instructions email ONLY for manual payment methods (not CASH)
        if (manualPaymentMethods.includes(paymentMethod)) {
            try {
                const { sendPaymentInstructions } = require('../services/emailService');
                await sendPaymentInstructions({
                    orderId: id,
                    customerName,
                    email,
                    totalAmount: finalTotalAmount,
                    shippingFee: finalShippingFee,
                    paymentMethod,
                    paymentConfig
                });
            } catch (emailError) {
                console.warn('[ORDER] Failed to send payment instructions email:', emailError.message);
            }
        }

        res.status(201).json({
            message: 'Order placed successfully.',
            id,
            status: initialStatus,
            requiresPayment: manualPaymentMethods.includes(paymentMethod)
        });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('[ORDER] Transaction failed:', error.message);
        res.status(400).json({ message: error.message || 'Failed to process order.' }); // Return 400 for logic errors
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

    const db = await getDb();

    // Start Transaction
    await db.exec('BEGIN');

    try {
        console.log(`[Shop] Updating order ${id} to status ${status}`);

        // Fetch order details for notification AND restocking
        const order = await db.get('SELECT * FROM online_orders WHERE id = ?', [id]);

        if (!order) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ message: 'Order not found' });
        }

        // Restock Logic if CANCELLED
        if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
            console.log(`[Shop] Restocking items for cancelled order ${id}`);
            let items = [];
            try {
                items = JSON.parse(order.items);
            } catch (e) {
                console.error('[Shop] Failed to parse items for restocking:', e);
            }

            for (const item of items) {
                await db.run('UPDATE parts SET quantity = quantity + ? WHERE id = ?', [item.qty, item.id]);
            }
        }

        await db.run(
            'UPDATE online_orders SET status = ?, updatedat = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        await db.exec('COMMIT');

        // Send Notification (Fire & Forget)
        if (order.email) {
            try {
                const { logNotification } = require('../utils/notifier');
                let notifType = null;
                if (status === 'PROCESSED') notifType = 'ORDER_PROCESSED';
                if (status === 'COMPLETED') notifType = 'ORDER_SHIPPED'; // COMPLETED = Shipped/Done
                if (status === 'CANCELLED') notifType = 'ORDER_CANCELLED';

                if (notifType) {
                    await logNotification(notifType, order.email, {
                        customerName: order.customername,
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
        await db.exec('ROLLBACK');
        console.error('Update Order Error:', {
            message: error.message,
            id,
            status,
            code: error.code
        });
        res.status(500).json({
            message: 'Failed to update order status. See server logs for details.',
            error: error.message
        });
    }
});

// @access  Private (Customer)
router.get('/my-orders', protect, async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all(`
            SELECT 
                id, 
                items, 
                totalamount as "totalAmount", 
                status, 
                delivery_method,
                tracking_number,
                courier_name,
                createdat as "createdAt"
            FROM online_orders 
            WHERE email = ?
            ORDER BY createdat DESC
        `, [req.user.email]);

        const parsedOrders = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items)
        }));

        res.json(parsedOrders);
    } catch (error) {
        console.error('My Orders Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @access  Private (Admin/Advisor)
router.delete('/orders/:id', protect, authorize('ADMIN', 'ADVISOR'), async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDb();

        // Check status first
        const order = await db.get('SELECT status FROM online_orders WHERE id = ?', [id]);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const protectedStatuses = ['PAID', 'PROCESSING', 'PROCESSED', 'SHIPPED', 'DELIVERED', 'COMPLETED'];
        if (protectedStatuses.includes(order.status)) {
            return res.status(400).json({
                message: `Cannot delete order with status '${order.status}'. Only PENDING or CANCELLED orders can be removed.`
            });
        }

        await db.run('DELETE FROM online_orders WHERE id = ?', [id]);
        res.json({ message: 'Order removed successfully' });
    } catch (error) {
        console.error('Delete Order Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
