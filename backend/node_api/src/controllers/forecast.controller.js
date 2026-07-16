const mlClient = require('../services/mlClient');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.getForecast = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const { horizon, model_type } = req.query;

    if (!productId) {
        throw new AppError('VALIDATION_ERROR', 'Yêu cầu productId', 400);
    }

    try {
        const result = await mlClient.forecast(
            parseInt(productId), 
            horizon ? parseInt(horizon) : 30, 
            model_type || 'xgboost'
        );

        res.status(200).json({
            success: true,
            data: result,
            message: 'Forecast retrieved successfully'
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        return res.status(200).json({ success: false, message: error.message });
    }
});

exports.trainModel = asyncHandler(async (req, res, next) => {
    const { model_type, training_period_days } = req.body;
    
    try {
        const result = await mlClient.trainModel(
            model_type || 'xgboost', 
            training_period_days || 365
        );

        res.status(200).json({
            success: true,
            data: result,
            message: 'Model training completed'
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('ML_SERVICE_ERROR', error.message, 502);
    }
});

exports.getModelInfo = asyncHandler(async (req, res, next) => {
    const { model_type } = req.query;
    
    try {
        const result = await mlClient.getModelInfo(model_type || 'xgboost');

        res.status(200).json({
            success: true,
            data: result,
            message: 'Model info retrieved successfully'
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('ML_SERVICE_ERROR', error.message, 502);
    }
});

exports.triggerETL = asyncHandler(async (req, res, next) => {
    try {
        const result = await mlClient.triggerETL();

        res.status(200).json({
            success: true,
            data: result,
            message: 'ETL triggered successfully'
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('ML_SERVICE_ERROR', error.message, 502);
    }
});
exports.runForecastBatch = asyncHandler(async (req, res, next) => {
    const { product_ids, horizon, model_type } = req.body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Yêu cầu mảng product_ids', 400);
    }

    try {
        const result = await mlClient.runForecastBatch(
            product_ids,
            horizon ? parseInt(horizon) : 30,
            model_type || 'xgboost'
        );

        res.status(200).json({
            success: true,
            data: result,
            message: 'Batch forecast completed successfully'
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        return res.status(200).json({ success: false, message: error.message });
    }
});

exports.compareModels = asyncHandler(async (req, res, next) => {
    const { productId } = req.query;

    if (!productId) {
        throw new AppError('VALIDATION_ERROR', 'Yêu cầu productId', 400);
    }

    try {
        const result = await mlClient.compareModels(productId);

        res.status(200).json({
            success: true,
            data: result,
            message: 'Model comparison retrieved successfully'
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        return res.status(200).json({ success: false, message: error.message });
    }
});
