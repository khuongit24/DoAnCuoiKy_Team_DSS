const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const getOverviewStats = asyncHandler(async (req, res, next) => {
    const [productsCount, totalRevenue, currentInventory] = await Promise.all([
        query('SELECT COUNT(*) FROM products'),
        query('SELECT COALESCE(SUM(revenue), 0) as sum FROM sales'),
        query('SELECT COALESCE(SUM(stock_quantity), 0) as sum FROM inventory')
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalProducts: parseInt(productsCount.rows[0].count || 0, 10),
            totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0),
            currentInventory: parseInt(currentInventory.rows[0].sum || 0, 10)
        },
        message: 'Lấy thống kê tổng quan thành công'
    });
});

const getAlerts = asyncHandler(async (req, res, next) => {
    const result = await query(`
        SELECT i.*, p.product_name, p.lifecycle_stage FROM inventory i 
        JOIN products p ON i.product_id = p.product_id 
        WHERE i.stock_quantity <= i.safety_stock OR p.lifecycle_stage = 'decline'
    `);
    
    const alerts = result.rows.map(row => {
        if (row.lifecycle_stage === 'decline') {
            return { type: 'lifecycle_alert', message: `Sản phẩm ${row.product_name} sắp hết hạn vòng đời` };
        }
        return { type: 'rop_alert', message: `Sản phẩm ${row.product_name} dưới mức tồn kho an toàn` };
    });

    res.status(200).json({
        success: true,
        data: alerts,
        message: 'Lấy danh sách cảnh báo thành công'
    });
});

const getFinancialStats = asyncHandler(async (req, res, next) => {
    const [revenueResult, costResult] = await Promise.all([
        query('SELECT COALESCE(SUM(revenue), 0) as sum FROM sales'),
        query('SELECT COALESCE(SUM((holding_cost_per_unit * stock_quantity) + ordering_cost), 0) as sum FROM inventory')
    ]);
    
    const revenue = parseFloat(revenueResult.rows[0].sum || 0);
    const costs = parseFloat(costResult.rows[0].sum || 0);

    res.status(200).json({
        success: true,
        data: {
            revenue,
            costs,
            profit: revenue - costs
        },
        message: 'Lấy thống kê tài chính thành công'
    });
});

const getSalesStats = asyncHandler(async (req, res, next) => {
    const [revenueResult, topProductResult, categoryDistResult] = await Promise.all([
        query('SELECT COALESCE(SUM(revenue), 0) as sum FROM sales'),
        query(`
            SELECT p.product_name, SUM(s.quantity_sold) as total_qty 
            FROM sales s 
            JOIN products p ON s.product_id = p.product_id 
            GROUP BY p.product_id, p.product_name 
            ORDER BY total_qty DESC 
            LIMIT 1
        `),
        query(`
            SELECT p.category, SUM(s.revenue) as value
            FROM sales s
            JOIN products p ON s.product_id = p.product_id
            GROUP BY p.category
            ORDER BY value DESC
        `)
    ]);

    const totalRevenue = parseFloat(revenueResult.rows[0].sum || 0);
    const topProduct = topProductResult.rows[0]?.product_name || 'N/A';
    const categoryDistribution = categoryDistResult.rows.map(row => ({
        name: row.category,
        value: parseFloat(row.value)
    }));

    res.status(200).json({
        success: true,
        data: {
            totalRevenue,
            revenueChange: 5.2, // Mocked percentage change for now
            topProduct,
            categoryDistribution
        },
        message: 'Lấy thống kê kinh doanh thành công'
    });
});

const getSalesTrend = asyncHandler(async (req, res, next) => {
    const { category } = req.query;
    let queryStr = `
        SELECT DATE(s.sale_date) as sale_date, SUM(s.revenue) as revenue
        FROM sales s
        JOIN products p ON s.product_id = p.product_id
    `;
    let params = [];

    if (category && category !== 'all') {
        queryStr += ` WHERE p.category ILIKE $1`;
        params.push(`%${category}%`);
    }

    queryStr += ` GROUP BY DATE(s.sale_date) ORDER BY DATE(s.sale_date) ASC`;
    
    const result = await query(queryStr, params);
    
    res.status(200).json({
        success: true,
        data: result.rows
    });
});

const getBudgetReport = asyncHandler(async (req, res, next) => {
    const mockBudget = [
        { key: '1', category: 'CPU', planned: 200000000, actual: 195000000, variance: -5000000 },
        { key: '2', category: 'GPU', planned: 350000000, actual: 380000000, variance: 30000000 },
        { key: '3', category: 'RAM', planned: 80000000, actual: 75000000, variance: -5000000 },
        { key: '4', category: 'Storage', planned: 120000000, actual: 125000000, variance: 5000000 },
    ];
    res.status(200).json({
        success: true,
        data: mockBudget,
        message: 'Lấy báo cáo ngân sách thành công'
    });
});

module.exports = {
    getOverviewStats,
    getAlerts,
    getFinancialStats,
    getSalesStats,
    getSalesTrend,
    getBudgetReport
};
