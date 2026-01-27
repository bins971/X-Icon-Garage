/**
 * Payment Validation Utility
 * Handles basic validation for card and mobile payments (Simulated)
 */

/**
 * Validates a credit card number using the Luhn Algorithm
 * @param {string} cardNumber 
 * @returns {boolean}
 */
const validateCardNumber = (cardNumber) => {
    const raw = cardNumber.replace(/\D/g, '');
    if (!raw || raw.length < 13 || raw.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;
    for (let i = raw.length - 1; i >= 0; i--) {
        let digit = parseInt(raw.charAt(i));
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
};

/**
 * Validates Philippine GCash mobile number format
 * Accepts: 9xxxxxxxxx (10 digits), 09xxxxxxxxx (11 digits), +639xxxxxxxxx
 * @param {string} phone 
 * @returns {boolean}
 */
const validateGCashNumber = (phone) => {
    // Remove all spaces
    const cleaned = phone.replace(/\s/g, '');

    // Accept formats:
    // 09xxxxxxxxx (11 digits starting with 09)
    // 9xxxxxxxxx (10 digits starting with 9)
    // +639xxxxxxxxx (13 chars starting with +639)
    const regex = /^(09\d{9}|9\d{9}|\+639\d{9})$/;
    return regex.test(cleaned);
};

/**
 * Masks sensitive payment strings for logging or display
 * @param {string} str 
 * @param {number} visibleChars 
 * @returns {string}
 */
const maskData = (str, visibleChars = 4) => {
    if (!str) return '****';
    if (str.length <= visibleChars) return str;
    return '*'.repeat(str.length - visibleChars) + str.slice(-visibleChars);
};

module.exports = {
    validateCardNumber,
    validateGCashNumber,
    maskData
};
