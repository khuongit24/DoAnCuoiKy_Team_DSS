-- ============================================================
-- SEED DATA (Development Environment Only)
-- ============================================================

-- 1. Admin user (password: admin123 -> bcrypt hash)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@dss.local', '$2b$12$hOFUjhdgBwryGK4.Ff.O6uwPfV07Xn7wiYa1Ek87E4GCS9LZnUHC6', 'System Admin', 'admin'),
('pm_nguyen', 'nguyen@dss.local', '$2b$12$hOFUjhdgBwryGK4.Ff.O6uwPfV07Xn7wiYa1Ek87E4GCS9LZnUHC6', 'Nguyễn Văn A', 'purchase_manager'),
('sd_tran', 'tran@dss.local', '$2b$12$hOFUjhdgBwryGK4.Ff.O6uwPfV07Xn7wiYa1Ek87E4GCS9LZnUHC6', 'Trần Thị B', 'sales_director'),
('fin_le', 'le@dss.local', '$2b$12$hOFUjhdgBwryGK4.Ff.O6uwPfV07Xn7wiYa1Ek87E4GCS9LZnUHC6', 'Lê Văn C', 'finance'),
('wm_pham', 'pham@dss.local', '$2b$12$hOFUjhdgBwryGK4.Ff.O6uwPfV07Xn7wiYa1Ek87E4GCS9LZnUHC6', 'Phạm Văn D', 'warehouse_manager');

-- 2. Sample products
INSERT INTO products (product_name, category, brand, lifecycle_stage) VALUES
('Intel Core i7-14700K', 'CPU', 'Intel', 'growth'),
('AMD Ryzen 7 7800X3D', 'CPU', 'AMD', 'maturity'),
('NVIDIA GeForce RTX 4060', 'GPU', 'NVIDIA', 'growth'),
('NVIDIA GeForce RTX 4070 Ti', 'GPU', 'NVIDIA', 'maturity'),
('Corsair Vengeance DDR5 32GB', 'RAM', 'Corsair', 'growth'),
('Samsung 990 Pro 1TB', 'Storage', 'Samsung', 'maturity'),
('ASUS ROG Strix B650E-F', 'Motherboard', 'ASUS', 'growth'),
('MSI MAG B760 Tomahawk', 'Motherboard', 'MSI', 'maturity'),
('Corsair RM850x', 'PSU', 'Corsair', 'maturity'),
('NZXT H7 Flow', 'Case', 'NZXT', 'growth');


-- 3. Sales Data (min 50 records)
INSERT INTO sales (sale_date, product_id, quantity_sold, revenue) VALUES
('2026-01-01', 1, 9, 3276),
('2026-02-02', 2, 7, 1736),
('2026-03-03', 3, 5, 2405),
('2026-04-04', 4, 2, 390),
('2026-05-05', 5, 12, 4860),
('2026-06-06', 6, 15, 6450),
('2026-01-07', 7, 20, 10980),
('2026-02-08', 8, 20, 2900),
('2026-03-09', 9, 12, 6828),
('2026-04-010', 10, 3, 924),
('2026-05-011', 1, 3, 1572),
('2026-06-012', 2, 8, 3256),
('2026-01-013', 3, 13, 5681),
('2026-02-014', 4, 9, 1116),
('2026-03-015', 5, 14, 2170),
('2026-04-016', 6, 4, 784),
('2026-05-017', 7, 14, 3878),
('2026-06-018', 8, 6, 660),
('2026-01-019', 9, 5, 1825),
('2026-02-020', 10, 5, 905),
('2026-03-021', 1, 3, 501),
('2026-04-022', 2, 1, 283),
('2026-05-023', 3, 2, 1018),
('2026-06-024', 4, 19, 2964),
('2026-01-025', 5, 15, 8310),
('2026-02-026', 6, 2, 674),
('2026-03-027', 7, 17, 2125),
('2026-04-028', 8, 11, 3124),
('2026-05-01', 9, 7, 2352),
('2026-06-02', 10, 13, 2080),
('2026-01-03', 1, 7, 1932),
('2026-02-04', 2, 17, 7480),
('2026-03-05', 3, 12, 5736),
('2026-04-06', 4, 5, 650),
('2026-05-07', 5, 3, 417),
('2026-06-08', 6, 10, 3480),
('2026-01-09', 7, 12, 6360),
('2026-02-010', 8, 10, 3030),
('2026-03-011', 9, 19, 7353),
('2026-04-012', 10, 12, 5664),
('2026-05-013', 1, 14, 6776),
('2026-06-014', 2, 13, 2834),
('2026-01-015', 3, 13, 4121),
('2026-02-016', 4, 20, 9420),
('2026-03-017', 5, 4, 1472),
('2026-04-018', 6, 12, 2340),
('2026-05-019', 7, 5, 2535),
('2026-06-020', 8, 2, 960),
('2026-01-021', 9, 11, 3564),
('2026-02-022', 10, 20, 10120),
('2026-03-023', 1, 8, 1360),
('2026-04-024', 2, 14, 7784),
('2026-05-025', 3, 6, 654),
('2026-06-026', 4, 7, 4109),
('2026-01-027', 5, 5, 1340),
('2026-02-028', 6, 6, 1014),
('2026-03-01', 7, 6, 3264),
('2026-04-02', 8, 16, 1904),
('2026-05-03', 9, 4, 2180),
('2026-06-04', 10, 17, 8925);

-- 4. Inventory (1 record per product per warehouse)
INSERT INTO inventory (product_id, warehouse_id, stock_quantity, safety_stock, holding_cost_per_unit, ordering_cost) VALUES
(1, 1, 83, 10, 5.0, 50.0),
(2, 1, 49, 10, 5.0, 50.0),
(3, 1, 81, 10, 5.0, 50.0),
(4, 1, 70, 10, 5.0, 50.0),
(5, 1, 62, 10, 5.0, 50.0),
(6, 1, 65, 10, 5.0, 50.0),
(7, 1, 68, 10, 5.0, 50.0),
(8, 1, 27, 10, 5.0, 50.0),
(9, 1, 70, 10, 5.0, 50.0),
(10, 1, 24, 10, 5.0, 50.0);

-- 5. Suppliers (2-4 per product)
INSERT INTO suppliers (supplier_name, product_id, price, lead_time, defect_rate, reliability_score) VALUES
('Supplier A for Prod 1', 1, 243, 2, 0.02, 94),
('Supplier B for Prod 1', 1, 589, 2, 0.05, 98),
('Supplier A for Prod 2', 2, 462, 12, 0.04, 84),
('Supplier B for Prod 2', 2, 416, 10, 0.03, 95),
('Supplier A for Prod 3', 3, 178, 14, 0.01, 96),
('Supplier B for Prod 3', 3, 558, 4, 0.05, 99),
('Supplier A for Prod 4', 4, 143, 7, 0.02, 85),
('Supplier B for Prod 4', 4, 292, 10, 0.02, 95),
('Supplier A for Prod 5', 5, 548, 7, 0.01, 94),
('Supplier B for Prod 5', 5, 350, 3, 0.03, 90),
('Supplier A for Prod 6', 6, 371, 13, 0.05, 88),
('Supplier B for Prod 6', 6, 151, 5, 0.01, 82),
('Supplier A for Prod 7', 7, 223, 3, 0.04, 87),
('Supplier B for Prod 7', 7, 107, 5, 0.02, 99),
('Supplier A for Prod 8', 8, 538, 2, 0.02, 93),
('Supplier B for Prod 8', 8, 143, 9, 0.02, 97),
('Supplier A for Prod 9', 9, 558, 5, 0.05, 91),
('Supplier B for Prod 9', 9, 297, 2, 0.02, 95),
('Supplier A for Prod 10', 10, 127, 9, 0.04, 98),
('Supplier B for Prod 10', 10, 189, 13, 0.02, 93);

-- 6. Market Data
INSERT INTO market (market_date, product_id, market_price, exchange_rate) VALUES
('2026-01-01', 1, 281, 24500.0),
('2026-02-01', 1, 271, 24600.0),
('2026-01-01', 2, 200, 24500.0),
('2026-02-01', 2, 232, 24600.0),
('2026-01-01', 3, 505, 24500.0),
('2026-02-01', 3, 255, 24600.0),
('2026-01-01', 4, 388, 24500.0),
('2026-02-01', 4, 412, 24600.0),
('2026-01-01', 5, 477, 24500.0),
('2026-02-01', 5, 369, 24600.0),
('2026-01-01', 6, 306, 24500.0),
('2026-02-01', 6, 449, 24600.0),
('2026-01-01', 7, 425, 24500.0),
('2026-02-01', 7, 326, 24600.0),
('2026-01-01', 8, 370, 24500.0),
('2026-02-01', 8, 287, 24600.0),
('2026-01-01', 9, 549, 24500.0),
('2026-02-01', 9, 383, 24600.0),
('2026-01-01', 10, 132, 24500.0),
('2026-02-01', 10, 260, 24600.0);

-- 7. AHP Configurations
INSERT INTO ahp_configurations (user_id, config_name, price_weight, quality_weight, delivery_weight, reliability_weight, is_default) VALUES
(1, 'Default AHP', 0.4000, 0.3000, 0.2000, 0.1000, TRUE);
