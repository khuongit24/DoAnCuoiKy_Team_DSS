const eoqRopService = require('../services/eoqRopService');
const db = require('../config/database');
const AppError = require('../utils/AppError');
const { eoqInputSchema, ropInputSchema } = require('../validators/inventory.validator');
const asyncHandler = require('../utils/asyncHandler');

const calculateEOQ = asyncHandler(async (req, res, next) => {
    const { error, value } = eoqInputSchema.validate(req.body);
    if (error) throw new AppError('VALIDATION_ERROR', error.details[0].message, 400);
    
    const result = eoqRopService.calculateEOQ(value.annualDemand, value.orderingCost, value.holdingCost);
    res.status(200).json({ success: true, data: result });
});

const calculateROP = asyncHandler(async (req, res, next) => {
    const { error, value } = ropInputSchema.validate(req.body);
    if (error) throw new AppError('VALIDATION_ERROR', error.details[0].message, 400);
    
    const result = eoqRopService.calculateROP(value.dailyDemand, value.leadTime, value.safetyStock);
    res.status(200).json({ success: true, data: result });
});

const getRecommendations = asyncHandler(async (req, res, next) => {
    const { productId } = req.query;
    if (!productId) throw new AppError('VALIDATION_ERROR', 'Yêu cầu productId', 400);

    const invQuery = await db.query(
        `SELECT i.*, p.product_name 
         FROM inventory i 
         JOIN products p ON i.product_id = p.product_id 
         WHERE i.product_id = $1 LIMIT 1`, 
         [productId]
    );
    if (invQuery.rows.length === 0) throw new AppError('NOT_FOUND', 'Không tìm thấy tồn kho cho sản phẩm này', 404);
    const inv = invQuery.rows[0];

    const salesQuery = await db.query(
        `SELECT SUM(quantity_sold) as total_sold 
         FROM sales 
         WHERE product_id = $1 AND sale_date >= NOW() - INTERVAL '1 year'`,
         [productId]
    );
    
    const annualDemand = salesQuery.rows[0].total_sold ? parseInt(salesQuery.rows[0].total_sold) : 1000;
    const dailyDemand = annualDemand / 365;
    const orderingCost = inv.ordering_cost ? parseFloat(inv.ordering_cost) : 500000;
    const holdingCost = inv.holding_cost_per_unit ? parseFloat(inv.holding_cost_per_unit) : 15000;
    
    // Retrieve avg lead time from suppliers if available
    const supplierQuery = await db.query(`SELECT AVG(lead_time) as avg_lead_time FROM suppliers WHERE product_id = $1 AND is_active = TRUE`, [productId]);
    const leadTime = supplierQuery.rows[0].avg_lead_time ? parseFloat(supplierQuery.rows[0].avg_lead_time) : 7;
    
    const serviceLevel = 0.95;
    const demandStdDev = dailyDemand * 0.2;
    const currentStock = inv.stock_quantity;

    const result = eoqRopService.getFullRecommendation(
        annualDemand, orderingCost, holdingCost, 
        dailyDemand, leadTime, serviceLevel, 
        demandStdDev, currentStock
    );
    
    res.status(200).json({ success: true, data: { ...result, current_stock: currentStock }, product_name: inv.product_name });
});

const getAlerts = asyncHandler(async (req, res, next) => {
    const query = await db.query(
        `SELECT i.product_id, p.product_name, i.stock_quantity as "currentStock", i.safety_stock as "safetyStock"
         FROM inventory i 
         JOIN products p ON i.product_id = p.product_id`
    );
    
    const alerts = query.rows.map(item => {
        const rop = item.safetyStock + 20; // Default buffer for ROP if not dynamically calculated
        return {
            id: item.product_id,
            product_name: item.product_name,
            currentStock: item.currentStock,
            rop: rop,
            safetyStock: item.safetyStock,
            status: eoqRopService.getStockStatus(item.currentStock, rop, item.safetyStock)
        };
    }).filter(item => item.status !== 'SAFE');

    res.status(200).json({ success: true, data: alerts });
});

const updateStock = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { stock_quantity } = req.body;
    
    if (stock_quantity === undefined || stock_quantity < 0) {
        throw new AppError('VALIDATION_ERROR', 'stock_quantity phải là số nguyên không âm', 400);
    }

    const result = await db.query(
        `UPDATE inventory SET stock_quantity = $1, last_updated = NOW() 
         WHERE inventory_id = $2 RETURNING *`,
        [stock_quantity, id]
    );

    if (result.rows.length === 0) {
        throw new AppError('NOT_FOUND', 'Không tìm thấy bản ghi inventory', 404);
    }

    res.status(200).json({ success: true, message: 'Cập nhật tồn kho thành công', data: result.rows[0] });
});

module.exports = {
    calculateEOQ,
    calculateROP,
    getRecommendations,
    getAlerts,
    updateStock
};
