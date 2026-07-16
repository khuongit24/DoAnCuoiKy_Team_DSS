const Joi = require('joi');

const pairwiseMatrixSchema = Joi.object({
    pairwiseMatrix: Joi.array().items(
        Joi.array().items(Joi.number().positive().required())
    ).min(4).max(4).required() // 4 criteria: price, quality, delivery, reliability
});

const weightsSchema = Joi.object({
    price: Joi.number().min(0).max(1).required(),
    quality: Joi.number().min(0).max(1).required(),
    delivery: Joi.number().min(0).max(1).required(),
    reliability: Joi.number().min(0).max(1).required()
}).custom((value, helpers) => {
    const sum = value.price + value.quality + value.delivery + value.reliability;
    if (Math.abs(sum - 1.0) > 0.01) {
        return helpers.message('Tổng trọng số phải bằng 1.0');
    }
    return value;
});

module.exports = {
    pairwiseMatrixSchema,
    weightsSchema
};
