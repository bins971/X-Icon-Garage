const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendTrackingNotification } = require('../src/services/emailService');

const testTrackingEmail = async () => {
    console.log('Sending test tracking email...');

    const mockOrder = {
        orderId: 'ORD-TEST-123456',
        customerName: 'Kiel Vincent',
        email: 'kielvincentalpapara003@gmail.com',
        courierName: 'LBC Express',
        trackingNumber: '1234-5678-TEST',
        items: [
            { name: 'Brembo Brake Pads', qty: 2, price: 5000 },
            { name: 'Motul Oil 5W-40', qty: 4, price: 850 },
            { name: 'Labor & Professional Inspection', qty: 1, price: 500 }
        ],
        totalAmount: 14050, // (5000*2) + (850*4) + 500 + 150 shipping
        shippingFee: 150,
        paymentMethod: 'COD'
    };

    try {
        const result = await sendTrackingNotification(mockOrder);
        console.log('✓ Test email sent successfully to:', mockOrder.email);
        if (result) console.log('API Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('✗ Failed to send test email:', error);
    }
};

testTrackingEmail();
