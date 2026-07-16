const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 số và 1 ký tự đặc biệt'
        }),
    full_name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('admin', 'purchase_manager', 'sales_director', 'finance', 'warehouse_manager').required()
});

const loginSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
    refresh_token: Joi.string().required()
});

module.exports = {
    registerSchema,
    loginSchema,
    refreshTokenSchema
};
