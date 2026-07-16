const { query } = require('../config/database');

class BaseModel {
    constructor(tableName, primaryKey = 'id', searchColumn = null) {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.searchColumn = searchColumn;
    }

    async findAll({ page = 1, limit = 20, sort = 'created_at', order = 'desc', filters = {}, search = '' }) {
        const offset = (page - 1) * limit;
        
        let filterKeys = Object.keys(filters);
        let whereConditions = [];
        let whereClause = '';
        let params = [];
        
        if (filterKeys.length > 0) {
            const conditions = filterKeys.map((rawKey, index) => {
                const key = rawKey.replace(/[^a-zA-Z0-9_]/g, '');
                params.push(filters[rawKey]);
                return `${key} = $${params.length}`;
            });
            whereConditions.push(...conditions);
        }

        if (search && this.searchColumn) {
            params.push(`%${search}%`);
            whereConditions.push(`${this.searchColumn} ILIKE $${params.length}`);
        }

        if (whereConditions.length > 0) {
            whereClause = `WHERE ${whereConditions.join(' AND ')}`;
        }

        const validOrders = ['asc', 'desc'];
        const sortOrder = validOrders.includes(order.toLowerCase()) ? order : 'desc';

        // Basic SQL injection defense for order by
        const sortColumn = sort.replace(/[^a-zA-Z0-9_]/g, '');

        const dataQuery = `
            SELECT * FROM ${this.tableName} 
            ${whereClause} 
            ORDER BY ${sortColumn} ${sortOrder} 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;

        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, [...params, limit, offset]),
            query(countQuery, params)
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    async findById(id) {
        const { rows } = await query(`SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`, [id]);
        return rows[0];
    }

    async create(data) {
        const keys = Object.keys(data).map(k => k.replace(/[^a-zA-Z0-9_]/g, ''));
        const values = Object.values(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        
        const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const { rows } = await query(sql, values);
        return rows[0];
    }

    async update(id, data) {
        const keys = Object.keys(data).map(k => k.replace(/[^a-zA-Z0-9_]/g, ''));
        const values = Object.values(data);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
        
        const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = NOW() WHERE ${this.primaryKey} = $${keys.length + 1} RETURNING *`;
        const { rows } = await query(sql, [...values, id]);
        return rows[0];
    }

    async delete(id) {
        const { rows } = await query(`DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1 RETURNING *`, [id]);
        return rows[0];
    }
}

module.exports = BaseModel;
