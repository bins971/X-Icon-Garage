
require('dotenv').config({ path: '../.env' });
const { sendPaymentConfirmation } = require('../src/services/emailService');

const testEmail = async () => {
    console.log('Testing Email Service...');
    console.log('Sending to default sender:', process.env.EMAIL_FROM || 'carworkshopa@gmail.com');

    try {
        await sendPaymentConfirmation({
            orderId: 'TEST-12345678',
            customerName: 'Test Admin',
            email: process.env.EMAIL_FROM || 'carworkshopa@gmail.com',
            totalAmount: 5000,
            shippingFee: 150,
            type: 'PAYMENT_RECEIVED'
        });
        console.log('✅ Email sent successfully checking logs above.');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
};

testEmail();
