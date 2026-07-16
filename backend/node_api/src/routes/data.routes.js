const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');
// Auth removed

// Entity validation middleware
const allowedEntities = ['products', 'sales', 'inventory', 'suppliers', 'market'];
router.param('entity', (req, res, next, entity) => {
    if (!allowedEntities.includes(entity)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ENTITY',
                message: `Entity '${entity}' không hợp lệ`
            }
        });
    }
    next();
});

// RBAC Middleware cho Data Routes
const dataRbacMiddleware = (req, res, next) => {
    const { entity } = req.params;
    const method = req.method;
    const userRole = req.user && req.user.role;

    if (!userRole) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Không có quyền truy cập' } });
    }

    if (userRole === 'admin') return next();

    const permissions = {
        products: { POST: ['purchase_manager'], PUT: ['purchase_manager'], DELETE: [] },
        sales: { POST: ['purchase_manager', 'sales_director'], PUT: ['purchase_manager', 'sales_director'], DELETE: [] },
        inventory: { POST: ['warehouse_manager'], PUT: ['warehouse_manager'], PATCH: ['warehouse_manager'], DELETE: [] },
        suppliers: { POST: ['purchase_manager'], PUT: ['purchase_manager'], DELETE: [] },
        market: { POST: ['purchase_manager', 'sales_director'], PUT: ['purchase_manager', 'sales_director'], DELETE: [] }
    };

    const allowedRoles = permissions[entity] && permissions[entity][method] ? permissions[entity][method] : [];

    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Vai trò của bạn không được phép thực hiện thao tác này'
            }
        });
    }

    next();
};

// Import route (must be before /:id routes)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
router.post('/:entity/import', dataRbacMiddleware, upload.single('file'), dataController.importJSON);

// CRUD routes mapping based on entity name
router.get('/:entity/by-product/:productId', dataRbacMiddleware, dataController.getSalesByProduct);
router.get('/:entity', dataController.getAll);
router.get('/:entity/:id', dataController.getById);
router.post('/:entity', dataRbacMiddleware, dataController.create);
router.put('/:entity/:id', dataRbacMiddleware, dataController.update);
router.delete('/:entity/:id', dataRbacMiddleware, dataController.remove);

module.exports = router;
