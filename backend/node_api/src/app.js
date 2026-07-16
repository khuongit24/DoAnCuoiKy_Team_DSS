const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimiters = require('./middlewares/rateLimiter');
const morgan = require('morgan');
const requestLogger = require('./middlewares/requestLogger');
const config = require('./config/env');
const { testConnection } = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
}));
app.use(cors({ 
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
// app.use('/api', rateLimiters.generalLimiter);
// app.use('/api/auth/login', rateLimiters.authLimiter);

// Route kiểm tra sức khỏe hệ thống
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        environment: config.nodeEnv,
        timestamp: new Date()
    });
});

// Register routes
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/forecast', require('./routes/forecast.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/suppliers', require('./routes/supplier.routes'));
app.use('/api/genai', require('./routes/genai.routes'));
app.use('/api', require('./routes/data.routes')); // data routes handles /api/:entity

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
    await testConnection(); // Kiểm tra kết nối database trước
    
    app.listen(config.port, () => {
        console.log(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = app;
