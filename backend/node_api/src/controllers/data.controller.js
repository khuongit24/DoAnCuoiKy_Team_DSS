const { ProductModel, SalesModel, InventoryModel, SupplierModel, MarketModel } = require('../models/data.models');
const AppError = require('../utils/AppError');
const { productSchema, salesSchema, inventorySchema, supplierSchema, marketSchema } = require('../validators/data.validator');
const fs = require('fs');
const csv = require('csv-parser');
const asyncHandler = require('../utils/asyncHandler');

const getModel = (entity) => {
    switch (entity) {
        case 'products': return ProductModel;
        case 'sales': return SalesModel;
        case 'inventory': return InventoryModel;
        case 'suppliers': return SupplierModel;
        case 'market': return MarketModel;
        default: return null;
    }
};

const getSchema = (entity) => {
    switch (entity) {
        case 'products': return productSchema;
        case 'sales': return salesSchema;
        case 'inventory': return inventorySchema;
        case 'suppliers': return supplierSchema;
        case 'market': return marketSchema;
        default: return null;
    }
};

const getAll = asyncHandler(async (req, res, next) => {
    const { entity } = req.params;
    const model = getModel(entity);
    if (!model) return next(new AppError('NOT_FOUND', 'Entity not found', 404));

    const { page = 1, limit = 20, sort, order, search, export: exportFormat, ...filters } = req.query;
    
    const result = await model.findAll({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort,
        order,
        search,
        filters
    });

    if (req.query.export === 'json') {
        try {
            if (!result.data || result.data.length === 0) {
                return res.status(200).send('[]');
            }
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${entity}.json`);
            return res.status(200).send(JSON.stringify(result.data, null, 2));
        } catch (exportError) {
            console.error('EXPORT JSON ERROR:', exportError);
            throw exportError;
        }
    }

    res.status(200).json({
        success: true,
        data: result.data,
        meta: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
        }
    });
});

const getById = asyncHandler(async (req, res, next) => {
    const { entity, id } = req.params;
    const model = getModel(entity);
    if (!model) return next(new AppError('NOT_FOUND', 'Entity not found', 404));

    const item = await model.findById(id);
    if (!item) return next(new AppError('NOT_FOUND', 'Not found', 404));

    res.status(200).json({ success: true, data: item });
});

const create = asyncHandler(async (req, res, next) => {
    const { entity } = req.params;
    const model = getModel(entity);
    if (!model) return next(new AppError('NOT_FOUND', 'Entity not found', 404));

    const schema = getSchema(entity);
    if (schema) {
        const { error, value } = schema.validate(req.body);
        if (error) throw new AppError('VALIDATION_ERROR', error.details[0].message, 400);
        req.body = value;
    }

    const newItem = await model.create(req.body);
    res.status(201).json({ success: true, data: newItem, message: 'Tạo mới thành công' });
});

const update = asyncHandler(async (req, res, next) => {
    const { entity, id } = req.params;
    const model = getModel(entity);
    if (!model) return next(new AppError('NOT_FOUND', 'Entity not found', 404));

    const schema = getSchema(entity);
    if (schema) {
        const { error, value } = schema.validate(req.body);
        if (error) throw new AppError('VALIDATION_ERROR', error.details[0].message, 400);
        req.body = value;
    }

    const updatedItem = await model.update(id, req.body);
    res.status(200).json({ success: true, data: updatedItem, message: 'Cập nhật thành công' });
});

const remove = asyncHandler(async (req, res, next) => {
    const { entity, id } = req.params;
    const model = getModel(entity);
    if (!model) return next(new AppError('NOT_FOUND', 'Entity not found', 404));

    await model.delete(id);
    res.status(200).json({ success: true, message: 'Xóa thành công' });
});

const importJSON = async (req, res, next) => {
    try {
        const { entity } = req.params;
        const model = getModel(entity);
        if (!model) return next(new AppError('NOT_FOUND', 'Entity not found', 404));

        if (!req.file) {
            return next(new AppError('VALIDATION_ERROR', 'Vui lòng upload file JSON', 400));
        }

        const schema = getSchema(entity);
        const results = [];
        const errors = [];
        let skipped = 0;
        let imported = 0;

        try {
            const fileContent = fs.readFileSync(req.file.path, 'utf8');
            const jsonData = JSON.parse(fileContent);
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

            for (const data of dataArray) {
                if (schema) {
                    const { error, value } = schema.validate(data, { allowUnknown: true });
                    if (error) {
                        errors.push({ row: data, error: error.details[0].message });
                        skipped++;
                    } else {
                        results.push(value);
                    }
                } else {
                    results.push(data);
                }
            }

            for (const row of results) {
                try {
                    await model.create(row);
                    imported++;
                } catch (err) {
                    errors.push({ row, error: err.message });
                    skipped++;
                }
            }

            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(200).json({
                success: true,
                message: 'Import JSON hoàn tất',
                data: {
                    total: results.length + skipped,
                    imported,
                    skipped,
                    errors: errors.length > 0 ? errors.slice(0, 50) : []
                }
            });
        } catch (error) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(new AppError('INTERNAL_ERROR', 'Lỗi phân tích file JSON: ' + error.message, 500));
        }
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(err);
    }
};

const getSalesByProduct = asyncHandler(async (req, res, next) => {
    const { entity, productId } = req.params;
    if (entity !== 'sales') {
        return next(new AppError('NOT_FOUND', 'Not found', 404));
    }

    const model = getModel(entity);
    const sales = await model.getSalesByProduct(productId);
    
    res.status(200).json({ success: true, data: sales });
});

module.exports = { getAll, getById, create, update, remove, importJSON, getSalesByProduct };
