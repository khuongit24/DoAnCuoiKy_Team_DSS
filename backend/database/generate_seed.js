const fs = require('fs');

let sql = `\n\n-- 3. Sales Data (min 50 records)\nINSERT INTO sales (sale_date, product_id, quantity_sold, revenue) VALUES\n`;
const sales = [];
for(let i=0; i<60; i++) {
    const pId = (i % 10) + 1;
    const date = `2026-0${(i%6)+1}-0${(i%28)+1}`;
    const qty = Math.floor(Math.random() * 20) + 1;
    const rev = qty * (Math.floor(Math.random() * 500) + 100);
    sales.push(`('${date}', ${pId}, ${qty}, ${rev})`);
}
sql += sales.join(',\n') + ';\n\n';

sql += `-- 4. Inventory (1 record per product per warehouse)\nINSERT INTO inventory (product_id, warehouse_id, stock_quantity, safety_stock, holding_cost_per_unit, ordering_cost) VALUES\n`;
const inventory = [];
for(let i=1; i<=10; i++) {
    inventory.push(`(${i}, 1, ${Math.floor(Math.random() * 100) + 20}, 10, 5.0, 50.0)`);
}
sql += inventory.join(',\n') + ';\n\n';

sql += `-- 5. Suppliers (2-4 per product)\nINSERT INTO suppliers (supplier_name, product_id, price, lead_time, defect_rate, reliability_score) VALUES\n`;
const suppliers = [];
for(let i=1; i<=10; i++) {
    suppliers.push(`('Supplier A for Prod ${i}', ${i}, ${Math.floor(Math.random() * 500) + 100}, ${Math.floor(Math.random() * 14) + 1}, 0.0${Math.floor(Math.random() * 5)+1}, ${Math.floor(Math.random() * 20) + 80})`);
    suppliers.push(`('Supplier B for Prod ${i}', ${i}, ${Math.floor(Math.random() * 500) + 100}, ${Math.floor(Math.random() * 14) + 1}, 0.0${Math.floor(Math.random() * 5)+1}, ${Math.floor(Math.random() * 20) + 80})`);
}
sql += suppliers.join(',\n') + ';\n\n';

sql += `-- 6. Market Data\nINSERT INTO market (market_date, product_id, market_price, exchange_rate) VALUES\n`;
const market = [];
for(let i=1; i<=10; i++) {
    market.push(`('2026-01-01', ${i}, ${Math.floor(Math.random() * 500) + 100}, 24500.0)`);
    market.push(`('2026-02-01', ${i}, ${Math.floor(Math.random() * 500) + 100}, 24600.0)`);
}
sql += market.join(',\n') + ';\n\n';

sql += `-- 7. AHP Configurations\nINSERT INTO ahp_configurations (user_id, config_name, price_weight, quality_weight, delivery_weight, reliability_weight, is_default) VALUES\n`;
sql += `(1, 'Default AHP', 0.4000, 0.3000, 0.2000, 0.1000, TRUE);\n`;

fs.appendFileSync('E:/DSS Tài liệu/Đồ án cuối kỳ/backend/database/seed.sql', sql);
