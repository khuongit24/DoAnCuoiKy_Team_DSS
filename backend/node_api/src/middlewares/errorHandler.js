const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // 1. Log lỗi
    logger.error({
        error_code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        stack: err.stack,
        request: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            user_id: req.user?.user_id,
            ip: req.ip
        },
        timestamp: new Date().toISOString()
    });

    // 2. Xác định response
    if (err.isOperational) {
        // Lỗi vận hành (đã biết) - trả về cho client
        return res.status(err.statusCode || 400).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details || null,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Xử lý các lỗi phổ biến từ thư viện khác (vd: JWT, database, JSON parser)
    if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Dữ liệu JSON không hợp lệ',
                timestamp: new Date().toISOString()
            }
        });
    }

    // 3. Lỗi không mong đợi (programming error) - ẩn chi tiết
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        }
    });
};

module.exports = errorHandler;
