const brevo = require('@getbrevo/brevo');

const sendPaymentInstructions = async ({ orderId, customerName, email, totalAmount, shippingFee = 0, paymentMethod, paymentConfig }) => {
    try {
        const shortOrderId = orderId.slice(0, 8).toUpperCase();

        let paymentDetails = '';

        if (paymentMethod === 'BANK_TRANSFER') {
            // Display all available banks
            const banksList = paymentConfig.bankTransfer.banks.map(bank => `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea;">
                    <h4 style="margin: 0 0 10px 0; color: #667eea; font-size: 14px;">${bank.name}</h4>
                    <p style="margin: 5px 0;"><strong>Account Name:</strong> ${bank.accountName}</p>
                    <p style="margin: 5px 0;"><strong>Account Number:</strong> <span style="font-family: monospace; font-size: 16px; color: #333;">${bank.accountNumber}</span></p>
                </div>
            `).join('');

            paymentDetails = `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Bank Transfer Options</h3>
                    <p style="color: #666; font-size: 14px;">Choose any bank below to transfer your payment:</p>
                    ${banksList}
                    <p style="margin: 15px 0 5px 0; color: #666; font-size: 13px;">💡 Use your Order ID as reference when transferring.</p>
                </div>
            `;
        } else if (paymentMethod === 'GCASH_MANUAL') {
            paymentDetails = `
                <div style="background: #007DF2; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">GCash Payment Details</h3>
                    <p style="margin: 5px 0;"><strong>GCash Number:</strong> ${paymentConfig.gcashManual.number}</p>
                    <p style="margin: 5px 0;"><strong>Account Name:</strong> ${paymentConfig.gcashManual.name}</p>
                    <p style="margin: 15px 0 5px 0;">${paymentConfig.gcashManual.instructions}</p>
                </div>
            `;
        }

        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `Payment Instructions - Order #${shortOrderId}`;
        sendSmtpEmail.to = [{ email, name: customerName }];
        sendSmtpEmail.sender = { name: 'X-ICON GARAGE', email: process.env.EMAIL_FROM || 'carworkshopa@gmail.com' };
        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">X-ICON GARAGE</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Order Confirmation</p>
                </div>
                
                <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                    <h2 style="color: #333; margin-top: 0;">Hi ${customerName},</h2>
                    <p>Thank you for your order! Your order has been received and is awaiting payment.</p>
                    
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>⏰ Payment Deadline:</strong> ${paymentConfig.paymentDeadline} hours from now</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Orders unpaid after this time will be automatically cancelled.</p>
                    </div>
                    
                    <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Summary</h3>
                    <p><strong>Order ID:</strong> #${shortOrderId}</p>
                    <div style="border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 10px 0; margin: 15px 0;">
                        <p style="margin: 5px 0; display: flex; justify-content: space-between;">
                            <span>Subtotal:</span>
                            <span>₱${(totalAmount - (shippingFee || 0)).toLocaleString()}</span>
                        </p>
                        ${shippingFee > 0 ? `
                        <p style="margin: 5px 0; display: flex; justify-content: space-between; color: #666;">
                            <span>Shipping Fee:</span>
                            <span>₱${shippingFee.toLocaleString()}</span>
                        </p>` : ''}
                        <p style="margin: 5px 0; display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #333; margin-top: 10px; border-top: 1px dashed #ddd; pt-2;">
                            <span>Total Amount:</span>
                            <span style="color: #10b981;">₱${totalAmount.toLocaleString()}</span>
                        </p>
                    </div>
                    
                    ${paymentDetails}
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #1976d2;">📸 After Payment:</h4>
                        <ol style="margin: 10px 0; padding-left: 20px;">
                            <li>Take a screenshot or photo of your payment receipt</li>
                            <li>Contact us to confirm your payment</li>
                            <li>We'll confirm your payment within 24 hours</li>
                        </ol>
                    </div>
                    
                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        If you have any questions, please contact us at <a href="mailto:orders@x-icon-garage.com" style="color: #667eea;">orders@x-icon-garage.com</a>
                    </p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
                    <p style="margin: 0;">© 2026 X-ICON GARAGE. All rights reserved.</p>
                    <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply.</p>
                </div>
            </body>
            </html>
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('[EMAIL] Payment instructions sent to:', email);
    } catch (error) {
        console.error('[EMAIL] Failed to send payment instructions:', error.message);
        // Don't throw - gracefully continue even if email fails
    }
};

const sendPaymentConfirmation = async ({ orderId, customerName, email, items, totalAmount, shippingFee, paymentMethod }) => {
    try {
        const shortOrderId = orderId.slice(0, 8).toUpperCase();
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

        const itemsListHtml = items.map((item) => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #000; font-weight: bold; font-size: 12px; text-transform: uppercase;">${item.name}</td>
                <td style="padding: 10px 0; text-align: center; color: #000; font-weight: bold; font-size: 12px;">${item.qty}</td>
                <td style="padding: 10px 0; text-align: right; color: #000; font-weight: bold; font-size: 12px;">₱${(Number(item.price)).toLocaleString()}</td>
                <td style="padding: 10px 0; text-align: right; color: #000; font-weight: bold; font-size: 12px;">₱${(Number(item.price) * item.qty).toLocaleString()}</td>
            </tr>
        `).join('');

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `Payment Confirmed - Order #${shortOrderId}`;
        sendSmtpEmail.to = [{ email, name: customerName }];
        sendSmtpEmail.sender = { name: 'X-ICON GARAGE', email: process.env.EMAIL_FROM || 'carworkshopa@gmail.com' };

        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
                    @media only screen and (max-width: 480px) {
                        .container { padding: 20px !important; }
                        .header-col { display: block !important; width: 100% !important; text-align: left !important; margin-bottom: 20px !important; }
                        .header-right { text-align: right !important; margin-top: 10px !important; }
                        .details-col { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
                        .total-section { width: 100% !important; }
                    }
                </style>
            </head>
            <body style="font-family: 'Montserrat', Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
                
                <!-- Main Container -->
                <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; position: relative; padding: 40px; border: 1px solid #eee;">
                    
                    <!-- Top Colors Strip -->
                    <div style="height: 8px; background-color: #f59e0b; width: 100%; position: absolute; top: 0; left: 0;"></div>

                    <!-- Header Section -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div class="header-col">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #f59e0b; font-style: italic; text-transform: uppercase;">
                                <span style="color: #000;">X-ICON</span> GARAGE
                            </h1>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 9px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.4;">
                                Reliable Performance | Elite Workshop<br>
                                Las Piñas City, Metro Manila
                            </p>
                        </div>
                        <div class="header-col header-right" style="text-align: right;">
                            <h2 style="margin: 0; font-size: 22px; font-weight: 900; font-style: italic; text-transform: uppercase; color: #000;">Payment Confirmed</h2>
                            <p style="margin: 5px 0 5px 0; color: #999; font-size: 10px; letter-spacing: 1px;">#INV-${shortOrderId}</p>
                            <span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase;">
                                PAID
                            </span>
                        </div>
                    </div>

                    <!-- Client & Info -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 40px;">
                        <div class="details-col" style="width: 48%;">
                            <p style="color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Client Details</p>
                            <h3 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #000;">${customerName}</h3>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #666; font-weight: bold;">${email}</p>
                            <p style="margin: 2px 0 0 0; font-size: 10px; color: #888;">Paid via ${paymentMethod}</p>
                        </div>
                        <div class="details-col" style="width: 48%;">
                            <p style="color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Date Issued</p>
                            <h3 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #000;">${date}</h3>
                        </div>
                    </div>

                    <!-- Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #000;">
                                <th style="text-align: left; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">PRD</th>
                                <th style="text-align: center; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                                <th style="text-align: right; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                                <th style="text-align: right; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsListHtml}
                        </tbody>
                    </table>

                    <!-- Totals Section -->
                    <div style="display: flex; justify-content: flex-end;">
                        <div class="total-section" style="width: 250px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #888; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Subtotal</span>
                                <span style="color: #000; font-size: 11px; font-weight: bold;">₱${(totalAmount - (shippingFee || 0)).toLocaleString()}</span>
                            </div>
                            ${shippingFee > 0 ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #888; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Shipping</span>
                                <span style="color: #000; font-size: 11px; font-weight: bold;">₱${shippingFee.toLocaleString()}</span>
                            </div>` : ''}
                            
                            <div style="background-color: #000; padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                                <span style="color: #fff; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Total</span>
                                <span style="color: #fff; font-size: 16px; font-weight: 900; font-style: italic;">₱${totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer w/ Watermark Area -->
                    <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                        <p style="color: #ccc; font-size: 9px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-style: italic;">Authentic Performance Guarantee</p>
                        <p style="margin: 5px 0 0 0; color: #999; font-size: 8px; line-height: 1.5;">
                            This digital receipt serves as your proof of ownership regarding X-ICON products.
                        </p>
                    </div>

                    <!-- Bottom Orange Border -->
                    <div style="height: 4px; background-color: #f59e0b; width: 100%; position: absolute; bottom: 0; left: 0;"></div>
                </div>

            </body>
            </html>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('[EMAIL] Payment confirmation sent to:', email);
        return data;
    } catch (error) {
        throw error;
    }
};

const sendTrackingNotification = async ({ orderId, customerName, email, courierName, trackingNumber, items = [], totalAmount, shippingFee = 0, paymentMethod }) => {
    try {
        const shortOrderId = orderId.slice(0, 8).toUpperCase();
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

        // Generate Items List HTML (Table Rows)
        const itemsListHtml = items.map((item, index) => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #000; font-weight: bold; font-size: 12px; text-transform: uppercase;">${item.name}</td>
                <td style="padding: 10px 0; text-align: center; color: #000; font-weight: bold; font-size: 12px;">${item.qty}</td>
                <td style="padding: 10px 0; text-align: right; color: #000; font-weight: bold; font-size: 12px;">₱${item.price.toLocaleString()}</td>
                <td style="padding: 10px 0; text-align: right; color: #000; font-weight: bold; font-size: 12px;">₱${(item.price * item.qty).toLocaleString()}</td>
            </tr>
        `).join('');

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `Official Receipt #${shortOrderId} - X-ICON GARAGE`;
        sendSmtpEmail.to = [{ email, name: customerName }];
        sendSmtpEmail.sender = { name: 'X-ICON GARAGE', email: process.env.EMAIL_FROM || 'carworkshopa@gmail.com' };

        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
                    @media only screen and (max-width: 480px) {
                        .container { padding: 20px !important; }
                        .header-col { display: block !important; width: 100% !important; text-align: left !important; margin-bottom: 20px !important; }
                        .header-right { text-align: right !important; margin-top: 10px !important; }
                        .details-col { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
                        .total-section { width: 100% !important; }
                    }
                </style>
            </head>
            <body style="font-family: 'Montserrat', Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
                
                <!-- Main Container -->
                <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; position: relative; padding: 40px; border: 1px solid #eee;">
                    
                    <!-- Top Colors Strip -->
                    <div style="height: 8px; background-color: #f59e0b; width: 100%; position: absolute; top: 0; left: 0;"></div>

                    <!-- Header Section -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div class="header-col">
                            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #f59e0b; font-style: italic; text-transform: uppercase;">
                                <span style="color: #000;">X-ICON</span> GARAGE
                            </h1>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 9px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.4;">
                                Reliable Performance | Elite Workshop<br>
                                Las Piñas City, Metro Manila
                            </p>
                        </div>
                        <div class="header-col header-right" style="text-align: right;">
                            <h2 style="margin: 0; font-size: 22px; font-weight: 900; font-style: italic; text-transform: uppercase; color: #000;">Official Receipt</h2>
                            <p style="margin: 5px 0 5px 0; color: #999; font-size: 10px; letter-spacing: 1px;">#INV-${shortOrderId}</p>
                            <span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 900; text-transform: uppercase;">
                                ${paymentMethod === 'COD' ? 'Pending (COD)' : 'PAID'}
                            </span>
                        </div>
                    </div>

                    <!-- Client & Info -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 40px;">
                        <div class="details-col" style="width: 48%;">
                            <p style="color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Client Details</p>
                            <h3 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #000;">${customerName}</h3>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #666; font-weight: bold;">${email}</p>
                        </div>
                        <div class="details-col" style="width: 48%;">
                            <p style="color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Tracking Details</p>
                            <h3 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; color: #000;">${courierName}</h3>
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #f59e0b; font-weight: 900;">TRK: ${trackingNumber}</p>
                            <p style="margin: 2px 0 0 0; font-size: 10px; color: #888;">${date}</p>
                        </div>
                    </div>

                    <!-- Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="border-bottom: 2px solid #000;">
                                <th style="text-align: left; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">PRD</th>
                                <th style="text-align: center; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                                <th style="text-align: right; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                                <th style="text-align: right; padding-bottom: 10px; color: #999; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsListHtml}
                        </tbody>
                    </table>

                    <!-- Totals Section -->
                    <div style="display: flex; justify-content: flex-end;">
                        <div class="total-section" style="width: 250px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #888; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Subtotal</span>
                                <span style="color: #000; font-size: 11px; font-weight: bold;">₱${(totalAmount - (shippingFee || 0)).toLocaleString()}</span>
                            </div>
                            ${shippingFee > 0 ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #888; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Shipping</span>
                                <span style="color: #000; font-size: 11px; font-weight: bold;">₱${shippingFee.toLocaleString()}</span>
                            </div>` : ''}
                            
                            <div style="background-color: #000; padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                                <span style="color: #fff; font-size: 10px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">Total</span>
                                <span style="color: #fff; font-size: 16px; font-weight: 900; font-style: italic;">₱${totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Footer w/ Watermark Area -->
                    <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                        <p style="color: #ccc; font-size: 9px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-style: italic;">Authentic Performance Guarantee</p>
                        <p style="margin: 5px 0 0 0; color: #999; font-size: 8px; line-height: 1.5;">
                            This digital receipt serves as your proof of ownership regarding X-ICON products.
                        </p>
                    </div>

                    <!-- Bottom Orange Border -->
                    <div style="height: 4px; background-color: #f59e0b; width: 100%; position: absolute; bottom: 0; left: 0;"></div>
                </div>

            </body>
            </html>
        `;

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('[EMAIL] Tracking notification sent to:', email);
        return data;
    } catch (error) {
        console.error('[EMAIL] Failed to send tracking notification:', error.message);
        throw error;
    }
};

module.exports = {
    sendPaymentInstructions,
    sendPaymentConfirmation,
    sendTrackingNotification
};

const sendInquiryNotification = async ({ customerName, email, phone, message, partName }) => {
    try {
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `New Inquiry: ${partName ? partName : 'General Question'}`;
        // Send to Admin email (configured as EMAIL_FROM for now, or could be a separate env var)
        sendSmtpEmail.to = [{ email: process.env.EMAIL_FROM || 'carworkshopa@gmail.com', name: 'Admin' }];
        sendSmtpEmail.sender = { name: 'X-ICON Website', email: process.env.EMAIL_FROM || 'carworkshopa@gmail.com' };
        sendSmtpEmail.replyTo = { email: email, name: customerName };

        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #667eea;">New Customer Inquiry</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>Name:</strong> ${customerName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                    ${partName ? `<p><strong>Part:</strong> ${partName}</p>` : ''}
                </div>
                <h3 style="color: #333;">Message:</h3>
                <p style="white-space: pre-wrap; background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">${message}</p>
            </div>
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('[EMAIL] Inquiry notification sent to Admin');
    } catch (error) {
        console.error('[EMAIL] Failed to send inquiry notification:', error.message);
    }
};

module.exports = {
    sendPaymentInstructions,
    sendPaymentConfirmation,
    sendTrackingNotification,
    sendInquiryNotification
};
