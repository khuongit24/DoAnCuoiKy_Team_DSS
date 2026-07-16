const BaseModel = require('./base.model');

class ProductModel extends BaseModel {
    constructor() {
        super('products', 'product_id', 'product_name');
    }
}
class SalesModel extends BaseModel {
    constructor() {
        super('sales', 'sales_id');
    }

    async getSalesByProduct(productId) {
        const sql = `
            SELECT sale_date, SUM(quantity_sold) as total_quantity, SUM(revenue) as total_revenue
            FROM sales
            WHERE product_id = $1
            GROUP BY sale_date
            ORDER BY sale_date ASC
        `;
        const { rows } = await require('../config/database').query(sql, [productId]);
        return rows;
    }

    async findAll({ page = 1, limit = 20, sort = 'sale_date', order = 'desc', filters = {}, search = '' }) {
        const offset = (page - 1) * limit;
        
        let filterKeys = Object.keys(filters);
        let whereConditions = [];
        let params = [];
        
        if (filterKeys.length > 0) {
            const conditions = filterKeys.map((rawKey, index) => {
                const key = rawKey.replace(/[^a-zA-Z0-9_]/g, '');
                params.push(filters[rawKey]);
                return `s.${key} = $${params.length}`;
            });
            whereConditions.push(...conditions);
        }

        if (search) {
            params.push(`%${search}%`);
            whereConditions.push(`p.product_name ILIKE $${params.length}`);
        }

        let whereClause = '';
        if (whereConditions.length > 0) {
            whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        }

        const validOrders = ['asc', 'desc'];
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order : 'desc';
        const sortColumn = sort.replace(/[^a-zA-Z0-9_]/g, '');

        const dataQuery = `
            SELECT s.*, p.product_name, p.supplier_name 
            FROM sales s 
            JOIN products p ON s.product_id = p.product_id 
            ${whereClause} 
            ORDER BY s.${sortColumn || 'sale_date'} ${sortOrder} 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        const countQuery = `
            SELECT COUNT(*) 
            FROM sales s 
            JOIN products p ON s.product_id = p.product_id 
            ${whereClause}
        `;

        const { query } = require('../config/database');
        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, [...params, limit, offset]),
            query(countQuery, params)
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }
}
class InventoryModel extends BaseModel {
    constructor() {
        super('inventory', 'inventory_id');
    }

    async findAll({ page = 1, limit = 20, sort = 'inventory_id', order = 'desc', filters = {}, search = '' }) {
        const offset = (page - 1) * limit;
        
        let filterKeys = Object.keys(filters);
        let whereConditions = [];
        let params = [];
        
        if (filterKeys.length > 0) {
            const conditions = filterKeys.map((rawKey, index) => {
                const key = rawKey.replace(/[^a-zA-Z0-9_]/g, '');
                params.push(filters[rawKey]);
                return `i.${key} = $${params.length}`;
            });
            whereConditions.push(...conditions);
        }

        if (search) {
            params.push(`%${search}%`);
            whereConditions.push(`p.product_name ILIKE $${params.length}`);
        }

        let whereClause = '';
        if (whereConditions.length > 0) {
            whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        }

        const validOrders = ['asc', 'desc'];
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order : 'desc';
        const sortColumn = sort.replace(/[^a-zA-Z0-9_]/g, '');

        const dataQuery = `
            SELECT i.*, p.product_name, p.category, p.supplier_name 
            FROM inventory i 
            JOIN products p ON i.product_id = p.product_id 
            ${whereClause} 
            ORDER BY i.${sortColumn || 'inventory_id'} ${sortOrder} 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        const countQuery = `
            SELECT COUNT(*) 
            FROM inventory i 
            JOIN products p ON i.product_id = p.product_id 
            ${whereClause}
        `;

        const { query } = require('../config/database');
        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, [...params, limit, offset]),
            query(countQuery, params)
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }
}
class SupplierModel extends BaseModel {
    constructor() {
        super('suppliers', 'supplier_id', 'supplier_name');
    }

    async findAll({ page = 1, limit = 20, sort = 'supplier_id', order = 'desc', filters = {}, search = '' }) {
        const offset = (page - 1) * limit;
        
        let filterKeys = Object.keys(filters);
        let whereConditions = [];
        let params = [];
        
        if (filterKeys.length > 0) {
            const conditions = filterKeys.map((rawKey, index) => {
                const key = rawKey.replace(/[^a-zA-Z0-9_]/g, '');
                params.push(filters[rawKey]);
                return `s.${key} = $${params.length}`;
            });
            whereConditions.push(...conditions);
        }

        if (search) {
            params.push(`%${search}%`);
            whereConditions.push(`p.product_name ILIKE $${params.length}`);
        }

        let whereClause = '';
        if (whereConditions.length > 0) {
            whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        }

        const validOrders = ['asc', 'desc'];
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order : 'desc';
        const sortColumn = sort.replace(/[^a-zA-Z0-9_]/g, '');

        const dataQuery = `
            SELECT s.*, p.product_name 
            FROM suppliers s 
            LEFT JOIN products p ON s.product_id = p.product_id 
            ${whereClause} 
            ORDER BY s.${sortColumn || 'supplier_id'} ${sortOrder} 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        const countQuery = `
            SELECT COUNT(*) 
            FROM suppliers s 
            LEFT JOIN products p ON s.product_id = p.product_id 
            ${whereClause}
        `;

        const { query } = require('../config/database');
        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, [...params, limit, offset]),
            query(countQuery, params)
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }
}
class MarketModel extends BaseModel {
    constructor() {
        super('market', 'market_id');
    }
}

module.exports = {
    ProductModel: new ProductModel(),
    SalesModel: new SalesModel(),
    InventoryModel: new InventoryModel(),
    SupplierModel: new SupplierModel(),
    MarketModel: new MarketModel(),
    GenAIConversationModel: require('./genai.model')
};
