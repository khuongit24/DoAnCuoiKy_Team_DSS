const supplierRankingService = require('../services/supplierRankingService');
const db = require('../config/database');
const AppError = require('../utils/AppError');
const { pairwiseMatrixSchema, weightsSchema } = require('../validators/supplier.validator');
const asyncHandler = require('../utils/asyncHandler');

const CRITERIA_TYPES = ['cost', 'cost', 'cost', 'benefit'];
const DEFAULT_WEIGHTS = [0.25, 0.25, 0.25, 0.25];

const configureWeights = asyncHandler(async (req, res, next) => {
    const { error, value } = pairwiseMatrixSchema.validate(req.body);
    if (error) {
        throw new AppError('VALIDATION_ERROR', error.details[0].message, 400);
    }
    
    const { pairwiseMatrix } = value;
    const config_name = req.body.config_name || 'Custom Config';
    
    const result = supplierRankingService.calculateAHPWeights(pairwiseMatrix);
    
    if (result.is_consistent) {
        const userId = (req.user && req.user.user_id) ? req.user.user_id : 1;
        
        await db.query(
            `INSERT INTO ahp_configurations 
            (user_id, config_name, price_weight, quality_weight, delivery_weight, reliability_weight, consistency_ratio, is_default) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, config_name, result.weights[0], result.weights[1], result.weights[2], result.weights[3], result.consistency_ratio, false]
        );
    }
    res.status(200).json({ success: true, data: result });
});

const _getSuppliersByProduct = async (productId) => {
    const result = await db.query(
        `SELECT supplier_id as id, supplier_name as name, price, lead_time, defect_rate, reliability_score
         FROM suppliers WHERE product_id = $1 AND is_active = TRUE`,
        [productId]
    );
    return result.rows;
};

const _getLatestWeights = async (userId) => {
    let result = await db.query(
        `SELECT price_weight, quality_weight, delivery_weight, reliability_weight 
         FROM ahp_configurations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
    );
    if (result.rows.length === 0) {
        result = await db.query(
            `SELECT price_weight, quality_weight, delivery_weight, reliability_weight 
             FROM ahp_configurations WHERE is_default = TRUE LIMIT 1`
        );
    }
    if (result.rows.length > 0) {
        const row = result.rows[0];
        return [
            parseFloat(row.price_weight), 
            parseFloat(row.quality_weight), // note: maps to defect_rate inside TOPSIS
            parseFloat(row.delivery_weight), // maps to lead_time
            parseFloat(row.reliability_weight)
        ];
    }
    return DEFAULT_WEIGHTS;
};

const getRanking = asyncHandler(async (req, res, next) => {
    const { productId } = req.query;
    if (!productId) {
        throw new AppError('VALIDATION_ERROR', 'Yêu cầu productId trong query parameter', 400);
    }
    
    const suppliers = await _getSuppliersByProduct(productId);
    if (suppliers.length === 0) {
        throw new AppError('NOT_FOUND', 'Không tìm thấy nhà cung cấp nào cho sản phẩm này', 404);
    }
    
    const userId = (req.user && req.user.user_id) ? req.user.user_id : 1;
    const weights = await _getLatestWeights(userId);
    const result = supplierRankingService.runTOPSIS(suppliers, weights, CRITERIA_TYPES);
    
    res.status(200).json({ success: true, data: result });
});

const evaluateSupplier = asyncHandler(async (req, res, next) => {
    const { suppliers, weights, criteriaTypes } = req.body;
    
    if (!suppliers || !Array.isArray(suppliers)) {
        throw new AppError('VALIDATION_ERROR', 'Yêu cầu danh sách suppliers', 400);
    }
    
    let evalWeights = DEFAULT_WEIGHTS;
    if (weights) {
        const { error, value } = weightsSchema.validate(weights);
        if (error) {
            throw new AppError('VALIDATION_ERROR', error.details[0].message, 400);
        }
        evalWeights = [value.price, value.quality, value.delivery, value.reliability];
    } else {
        const userId = (req.user && req.user.user_id) ? req.user.user_id : 1;
        evalWeights = await _getLatestWeights(userId);
    }
    
    const evalTypes = criteriaTypes || CRITERIA_TYPES;
    const result = supplierRankingService.runTOPSIS(suppliers, evalWeights, evalTypes);
    res.status(200).json({ success: true, data: result });
});

const getRankingByProduct = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const suppliers = await _getSuppliersByProduct(productId);
    
    if (suppliers.length === 0) {
        throw new AppError('NOT_FOUND', 'Không tìm thấy nhà cung cấp nào', 404);
    }
    
    const userId = (req.user && req.user.user_id) ? req.user.user_id : 1;
    const weights = await _getLatestWeights(userId);
    const result = supplierRankingService.runTOPSIS(suppliers, weights, CRITERIA_TYPES);
    
    res.status(200).json({ success: true, productId, data: result });
});

module.exports = {
    configureWeights,
    getRanking,
    evaluateSupplier,
    getRankingByProduct
};
