module.exports = {
    bankTransfer: {
        enabled: true,
        banks: [
            {
                name: 'BDO',
                accountName: 'X-ICON GARAGE',
                accountNumber: '1234567890',
                instructions: 'Please use your Order ID as reference when transferring.'
            },
            {
                name: 'BPI',
                accountName: 'X-ICON GARAGE',
                accountNumber: '0987654321',
                instructions: 'Please use your Order ID as reference when transferring.'
            }
            // Add more banks as needed
        ]
    },

    // Manual GCash Payment (separate from bank transfer)
    gcashManual: {
        enabled: true,
        number: '09171234567',
        name: 'X-ICON GARAGE',
        instructions: 'Send payment via GCash and take a screenshot of the receipt.'
    },

    // Shipping Configuration
    shipping: {
        enabled: true,
        flatRate: 150, // Flat rate shipping fee
        freeShippingThreshold: 5000, // Free shipping for orders above this amount
        courierOptions: ['LBC', 'J&T Express', 'Lalamove', 'Grab Express', 'Other']
    },

    // PayMongo Configuration (for future use)
    paymongo: {
        enabled: false,
        publicKey: process.env.PAYMONGO_PUBLIC_KEY,
        secretKey: process.env.PAYMONGO_SECRET_KEY
    },

    // Payment deadline in hours
    paymentDeadline: 48
};
