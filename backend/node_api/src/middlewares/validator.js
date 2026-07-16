const AppError = require('../utils/AppError');

const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], { abortEarly: false });
        
        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new AppError('VALIDATION_ERROR', errorMessage, 400));
        }
        
        // Re-assign the validated value back to the request property
        req[property] = value;
        next();
    };
};

module.exports = validate;
