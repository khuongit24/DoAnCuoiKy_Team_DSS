const Joi = require('joi');

const eoqInputSchema = Joi.object({
    annualDemand: Joi.number().positive().required(),
    orderingCost: Joi.number().positive().required(),
    holdingCost: Joi.number().positive().required()
});

const ropInputSchema = Joi.object({
    leadTime: Joi.number().min(0).required(),
    dailyDemand: Joi.number().min(0).required(),
    safetyStock: Joi.number().min(0).required()
});

module.exports = {
    eoqInputSchema,
    ropInputSchema
};
