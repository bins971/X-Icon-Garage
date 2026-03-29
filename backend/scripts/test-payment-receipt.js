const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendPaymentConfirmation } = require('../src/services/emailService');

const testReceiptEmail = async () => {
    console.log('Sending test Payment Receipt email...');

    // Mock data for a confirmed payment
    const mockPayment = {
        orderId: 'ORD-PAY-987654',
        customerName: 'Kiel Vincent',
        email: 'kielvincentalpapara003@gmail.com',
        totalAmount: 5600, // 5450 + 150
        shippingFee: 150,
        type: 'PAYMENT_RECEIVED'
    };

    try {
        const result = await sendPaymentConfirmation(mockPayment);
        console.log('✓ Receipt email sent successfully to:', mockPayment.email);
        if (result) console.log('API Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('✗ Failed to send receipt email:', error);
    }
};

testReceiptEmail();
