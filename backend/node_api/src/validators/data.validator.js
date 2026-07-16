const Joi = require('joi');

const productSchema = Joi.object({
    product_name: Joi.string().max(255).required(),
    category: Joi.string().valid('CPU', 'GPU', 'RAM', 'Motherboard', 'Storage', 'PSU', 'Case', 'Cooling', 'Laptop', 'Peripherals', 'Monitor', 'Audio').required(),
    brand: Joi.string().max(100).required(),
    lifecycle_stage: Joi.string().valid('introduction', 'growth', 'maturity', 'decline').default('growth'),
    description: Joi.string().allow('', null)
});

const salesSchema = Joi.object({
    sale_date: Joi.date().iso().required(),
    product_id: Joi.number().integer().positive().required(),
    quantity_sold: Joi.number().integer().positive().required(),
    revenue: Joi.number().min(0).required(),
    promotion_flag: Joi.boolean().default(false),
    notes: Joi.string().allow('', null)
});

const inventorySchema = Joi.object({
    product_id: Joi.number().integer().positive().required(),
    stock_quantity: Joi.number().integer().min(0).required(),
    safety_stock: Joi.number().integer().min(0).default(0),
    warehouse_id: Joi.number().integer().positive().required(),
    holding_cost_per_unit: Joi.number().min(0).allow(null),
    ordering_cost: Joi.number().min(0).allow(null)
});

const supplierSchema = Joi.object({
    supplier_name: Joi.string().max(255).required(),
    product_id: Joi.number().integer().positive().required(),
    price: Joi.number().greater(0).required(),
    lead_time: Joi.number().integer().greater(0).required(),
    defect_rate: Joi.number().min(0).max(1).required(),
    reliability_score: Joi.number().min(0).max(100).required(),
    contact_email: Joi.string().email().allow('', null),
    contact_phone: Joi.string().max(20).allow('', null),
    is_active: Joi.boolean().default(true)
});

const marketSchema = Joi.object({
    market_date: Joi.date().iso().required(),
    product_id: Joi.number().integer().positive().required(),
    market_price: Joi.number().greater(0).required(),
    exchange_rate: Joi.number().greater(0).required(),
    new_product_flag: Joi.boolean().default(false),
    notes: Joi.string().allow('', null)
});

module.exports = {
    productSchema,
    salesSchema,
    inventorySchema,
    supplierSchema,
    marketSchema
};
