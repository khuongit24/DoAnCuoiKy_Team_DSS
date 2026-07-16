const Joi = require('joi');

const explainSchema = Joi.object({
    type: Joi.string().required(),
    product_id: Joi.number().integer().positive().required(),
    context: Joi.object().required()
});

const chatSchema = Joi.object({
    message: Joi.string().required()
});

module.exports = {
    explainSchema,
    chatSchema
};
