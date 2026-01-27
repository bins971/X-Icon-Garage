require('@dotenvx/dotenvx').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { getDb } = require('./config/database');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Enable Gzip Compression
app.use(compression());

// Trust Proxy (Required for Railway/Heroku)
app.set('trust proxy', 1);


// 1. CORS (Allow frontend)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-src": ["'self'", "https://www.google.com", "https://maps.google.com"],
            "img-src": ["'self'", "data:", "https://*.googleapis.com", "https://*.gstatic.com", "https://*.google.com", "https://res.cloudinary.com"],
            "script-src": ["'self'", "'unsafe-inline'", "https://*.googleapis.com", "https://*.google.com"],
            "connect-src": ["'self'", "https://*.googleapis.com", "https://*.google.com"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. Body Parser
app.use(express.json({ limit: '10kb' }));


// 5. Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests from this IP, please try again after 10 minutes' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts, please try again after an hour.' }
});

const payoutLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Maximum payout attempts reached. Please try again later.' }
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/reports/verify-pin', authLimiter);
app.use('/api/reports/payout', payoutLimiter);

// 6. Logging
app.use(morgan('dev'));

// Static files (Uploads)
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Database initialization
getDb().then(() => {
    console.log('Database connection ready.');
}).catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});




// Routes
app.use('/api/public', require('./routes/public'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/parts', require('./routes/parts'));
app.use('/api/job-orders', require('./routes/jobOrders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/reports', require('./routes/reports'));

// --- Frontend Serving ---
const path = require('path');
// Serve static files from frontend/dist
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

// Catch-all route for React client-side routing
app.get('*any', (req, res) => {
    // Only serve index.html if not an /api route (api routes handled above)
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
    }
});

const PORT = process.env.PORT || 5000;

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', JSON.stringify(err, null, 2));
    if (err.message) console.error('ERROR MESSAGE:', err.message);

    // Cloudinary specifc error handling
    if (err.http_code) {
        return res.status(err.http_code).json({ message: err.message || 'Cloudinary Error' });
    }

    res.status(500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
