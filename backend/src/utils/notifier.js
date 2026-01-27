const fs = require('fs');
const path = require('path');
const brevo = require('@getbrevo/brevo');

const logNotification = async (type, recipient, data) => {
    const timestamp = new Date().toISOString();
    const subject = getSubject(type, data);
    const content = getContent(type, data);

    const logEntry = {
        timestamp,
        type,
        to: recipient,
        subject,
        content
    };

    console.log(`[NOTIFICATION] Preparing to send ${type} to ${recipient}...`);

    // 1. File Logging (Keep as backup/record)
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    const logPath = path.join(logDir, 'notifications.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

    // 2. Real Email Sending via Brevo API
    if (process.env.BREVO_API_KEY) {
        try {
            const apiInstance = new brevo.TransactionalEmailsApi();
            apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

            const sendSmtpEmail = new brevo.SendSmtpEmail();
            sendSmtpEmail.sender = {
                name: 'X-ICON Garage',
                email: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'carworkshopa@gmail.com'
            };
            sendSmtpEmail.to = [{ email: recipient }];
            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #e5e5e5;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 900; letter-spacing: 2px;">X-ICON GARAGE</h1>
                    </div>
                    <div style="background: #171717; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #262626;">
                        <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px;">${subject}</h2>
                        <div style="color: #a3a3a3; line-height: 1.6; white-space: pre-line;">${content}</div>
                        <hr style="border: none; border-top: 1px solid #262626; margin: 30px 0;">
                        <p style="font-size: 12px; color: #737373; text-align: center; margin: 0;">
                            This is an automated message from X-ICON Garage.<br>
                            Dahlia Corner Everlasting St., TS Cruz Subd, Almanza Dos, Las Piñas City
                        </p>
                    </div>
                </div>
            `;

            const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log(`[EMAIL SENT] Successfully sent to ${recipient} via Brevo (ID: ${result.messageId})`);
        } catch (emailErr) {
            console.error('[EMAIL FAIL] Brevo API error:', emailErr.message);
            // Don't throw - allow booking to succeed even if email fails
        }
    } else {
        console.warn('[EMAIL SKIP] BREVO_API_KEY not configured in environment');
    }

    return true;
};

const getSubject = (type, data) => {
    switch (type) {
        case 'JOB_ORDER_CREATED':
            return `New Repair Job Started: ${data.jobNumber}`;
        case 'PAYMENT_RECEIVED':
            return `Payment Received - Receipt for ${data.invoiceNumber}`;
        case 'JOB_READY':
            return `Project Completed: ${data.jobNumber} is ready for release`;
        case 'BOOKING_REQUESTED':
            return `Appointment Request Received: ${data.bookingRef}`;
        case 'APPOINTMENT_CONFIRMED':
            return `Appointment Confirmed: ${data.bookingRef} - ${data.date}`;
        case 'APPOINTMENT_CANCELLED':
            return `Appointment Cancelled: ${data.bookingRef}`;
        case 'APPOINTMENT_COMPLETED':
            return `Service Completed: ${data.bookingRef}`;
        case 'ORDER_PROCESSED':
            return `Order Processed: ${data.orderId}`;
        case 'ORDER_SHIPPED':
            return `Order Shipped: ${data.orderId}`;
        case 'ORDER_CANCELLED':
            return `Order Cancelled: ${data.orderId}`;
        default:
            return 'Car Workshop Notification';
    }
};

const getContent = (type, data) => {
    switch (type) {
        case 'JOB_ORDER_CREATED':
            return `Hello ${data.customerName}, your vehicle (${data.vehicle}) has been checked in. Your Job Order Number is ${data.jobNumber}. You can track it at /track using this number and your plate ${data.plateNumber}.`;
        case 'PAYMENT_RECEIVED':
            return `Hello ${data.customerName}, we received your payment of ${data.amount}. Your invoice ${data.invoiceNumber} is now ${data.status}. View your digital receipt here: /receipt/${data.invoiceId}`;
        case 'JOB_READY':
            return `Great news, ${data.customerName}! The work on your ${data.vehicle} is complete. Your final bill is ${data.totalAmount}. See you at the workshop!`;
        case 'BOOKING_REQUESTED':
            if (data.serviceType === 'Home Service' && data.address) {
                return `Hi ${data.customerName}, we've received your Home Service request for ${data.date}. We will come to: ${data.address}. Reference: ${data.bookingRef}. We will contact you soon to confirm!`;
            }
            return `Hi ${data.customerName}, we've received your appointment request for ${data.serviceType} on ${data.date}. Your reference code is ${data.bookingRef}. We will contact you soon to confirm!`;
        case 'APPOINTMENT_CONFIRMED':
            if (data.serviceType === 'Home Service') {
                return `Good news ${data.customerName}! Your Home Service appointment (${data.bookingRef}) for ${data.date} has been CONFIRMED. Our mechanics will arrive at your address 10-15 mins before schedule.`;
            }
            return `Good news ${data.customerName}! Your appointment (${data.bookingRef}) for ${data.serviceType} on ${data.date} has been CONFIRMED. Please arrive 10 minutes early.`;
        case 'APPOINTMENT_CANCELLED':
            return `Hi ${data.customerName}, your appointment (${data.bookingRef}) has been cancelled. If this was a mistake, please contact us immediately.`;
        case 'APPOINTMENT_COMPLETED':
            return `Thank you for visiting, ${data.customerName}! Your service (${data.bookingRef}) is complete. We hope your car runs smoothly!`;
        case 'ORDER_PROCESSED':
            return `Hello ${data.customerName}, your order #${data.orderId} is now being processed. We will notify you when it ships.`;
        case 'ORDER_SHIPPED':
            return `Great news ${data.customerName}! Your order #${data.orderId} has been shipped. It should arrive soon.`;
        case 'ORDER_CANCELLED':
            return `Hello ${data.customerName}, your order #${data.orderId} has been cancelled. Refund processing may take 3-5 business days.`;
        default:
            return 'Thank you for choosing Reliable Performance.';
    }
};

module.exports = { logNotification };
