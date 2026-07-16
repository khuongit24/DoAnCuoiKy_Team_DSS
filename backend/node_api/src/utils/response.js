const sendSuccess = (res, data, message = 'Thành công', statusCode = 200, meta = null) => {
    const response = {
        success: true,
        message,
        data
    };
    if (meta) response.meta = meta;
    
    return res.status(statusCode).json(response);
};

const sendError = (res, error, statusCode = 500) => {
    const code = error.code || 'INTERNAL_ERROR';
    const message = error.message || 'Lỗi hệ thống';
    
    return res.status(statusCode).json({
        success: false,
        error: {
            code,
            message
        }
    });
};

module.exports = {
    sendSuccess,
    sendError
};
