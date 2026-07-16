const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // relaxed limit
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Quá nhiều yêu cầu' } }
});

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 500, // relaxed limit
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Quá nhiều lần đăng nhập thất bại' } }
});

module.exports = {
    generalLimiter,
    authLimiter
};
