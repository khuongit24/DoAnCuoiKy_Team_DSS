module.exports = {
    ROLES: {
        ADMIN: 'admin',
        WAREHOUSE_MANAGER: 'warehouse_manager',
        PURCHASE_MANAGER: 'purchase_manager',
        FINANCE: 'finance',
        SALES_DIRECTOR: 'sales_director'
    },
    ERROR_CODES: {
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        UNAUTHORIZED: 'UNAUTHORIZED',
        FORBIDDEN: 'FORBIDDEN',
        NOT_FOUND: 'NOT_FOUND',
        CONFLICT: 'CONFLICT',
        INTERNAL_ERROR: 'INTERNAL_ERROR',
        TOKEN_INVALID: 'TOKEN_INVALID',
        INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
        ML_SERVICE_ERROR: 'ML_SERVICE_ERROR'
    },
    PAGINATION_LIMITS: {
        DEFAULT: 20,
        MAX: 100
    },
    ENTITIES: {
        PRODUCTS: 'products',
        SALES: 'sales',
        INVENTORY: 'inventory',
        SUPPLIERS: 'suppliers',
        MARKET: 'market'
    }
};
