-- ============================================================
-- DSS Electronics - Database Schema
-- PostgreSQL >= 14
-- File: backend/database/schema.sql
-- ============================================================

-- Xóa bảng cũ nếu tồn tại (thứ tự ngược để tránh lỗi FK)
DROP TABLE IF EXISTS market CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. BẢNG USERS
-- ============================================================
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(30) NOT NULL CHECK (role IN (
                        'purchase_manager', 
                        'sales_director', 
                        'finance', 
                        'warehouse_manager', 
                        'admin'
                    )),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login      TIMESTAMP,
    refresh_token   TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG PRODUCTS
-- ============================================================
CREATE TABLE products (
    product_id      SERIAL PRIMARY KEY,
    product_name    VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL CHECK (category IN (
                        'CPU', 'GPU', 'RAM', 'Motherboard', 
                        'Storage', 'PSU', 'Case', 'Cooling'
                    )),
    brand           VARCHAR(100) NOT NULL,
    lifecycle_stage VARCHAR(20) NOT NULL DEFAULT 'growth' CHECK (lifecycle_stage IN (
                        'introduction', 'growth', 'maturity', 'decline'
                    )),
    description     TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. BẢNG SALES
-- ============================================================
CREATE TABLE sales (
    sales_id        SERIAL PRIMARY KEY,
    sale_date       DATE NOT NULL,
    product_id      INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    quantity_sold   INTEGER NOT NULL CHECK (quantity_sold > 0),
    revenue         DECIMAL(15,2) NOT NULL CHECK (revenue >= 0),
    promotion_flag  BOOLEAN DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. BẢNG INVENTORY
-- ============================================================
CREATE TABLE inventory (
    inventory_id            SERIAL PRIMARY KEY,
    product_id              INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    stock_quantity          INTEGER NOT NULL CHECK (stock_quantity >= 0),
    safety_stock            INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
    warehouse_id            INTEGER NOT NULL,
    holding_cost_per_unit   DECIMAL(12,2) CHECK (holding_cost_per_unit >= 0),
    ordering_cost           DECIMAL(12,2) CHECK (ordering_cost >= 0),
    last_updated            TIMESTAMP DEFAULT NOW(),
    created_at              TIMESTAMP DEFAULT NOW(),
    
    -- Mỗi sản phẩm chỉ có 1 bản ghi tồn kho trong mỗi kho
    CONSTRAINT uq_product_warehouse UNIQUE (product_id, warehouse_id)
);

-- ============================================================
-- 5. BẢNG SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
    supplier_id     SERIAL PRIMARY KEY,
    supplier_name   VARCHAR(255) NOT NULL,
    product_id      INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    price           DECIMAL(15,2) NOT NULL CHECK (price > 0),
    lead_time       INTEGER NOT NULL CHECK (lead_time > 0),
    defect_rate     DECIMAL(5,4) NOT NULL CHECK (defect_rate >= 0 AND defect_rate <= 1),
    reliability_score DECIMAL(5,2) NOT NULL CHECK (reliability_score >= 0 AND reliability_score <= 100),
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. BẢNG MARKET
-- ============================================================
CREATE TABLE market (
    market_id           SERIAL PRIMARY KEY,
    market_date         DATE NOT NULL,
    product_id          INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    market_price        DECIMAL(15,2) NOT NULL CHECK (market_price > 0),
    exchange_rate       DECIMAL(10,2) NOT NULL CHECK (exchange_rate > 0),
    new_product_flag    BOOLEAN DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. BẢNG PHỤ TRỢ: AHP_CONFIGURATIONS (Lưu cấu hình trọng số AHP)
-- ============================================================
CREATE TABLE ahp_configurations (
    config_id           SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(user_id),
    config_name         VARCHAR(100) NOT NULL,
    price_weight        DECIMAL(5,4) NOT NULL CHECK (price_weight >= 0 AND price_weight <= 1),
    quality_weight      DECIMAL(5,4) NOT NULL CHECK (quality_weight >= 0 AND quality_weight <= 1),
    delivery_weight     DECIMAL(5,4) NOT NULL CHECK (delivery_weight >= 0 AND delivery_weight <= 1),
    reliability_weight  DECIMAL(5,4) NOT NULL CHECK (reliability_weight >= 0 AND reliability_weight <= 1),
    consistency_ratio   DECIMAL(6,4),
    is_default          BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    -- Tổng trọng số phải = 1.0 (kiểm tra ở application level vì check constraint khó viết chính xác cho DECIMAL)
    CONSTRAINT chk_weights_sum CHECK (
        ABS((price_weight + quality_weight + delivery_weight + reliability_weight) - 1.0) < 0.01
    )
);

-- ============================================================
-- 8. BẢNG PHỤ TRỢ: FORECAST_RESULTS (Cache kết quả dự báo)
-- ============================================================
CREATE TABLE forecast_results (
    forecast_id     SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(product_id),
    forecast_date   DATE NOT NULL,
    predicted_demand INTEGER NOT NULL,
    model_type      VARCHAR(30) NOT NULL CHECK (model_type IN ('xgboost', 'arima', 'prophet')),
    mae             DECIMAL(10,4),
    rmse            DECIMAL(10,4),
    mape            DECIMAL(6,4),
    created_at      TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uq_forecast UNIQUE (product_id, forecast_date, model_type)
);

-- ============================================================
-- 9. BẢNG PHỤ TRỢ: GENAI_CONVERSATIONS (Lịch sử hội thoại AI)
-- ============================================================
CREATE TABLE genai_conversations (
    conversation_id SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id),
    message_role    VARCHAR(10) NOT NULL CHECK (message_role IN ('user', 'assistant')),
    message_content TEXT NOT NULL,
    context_data    JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_lifecycle ON products(lifecycle_stage);

-- Sales (bảng lớn nhất - cần index kỹ)
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_product_date ON sales(product_id, sale_date);  -- Composite index cho truy vấn time-series
CREATE INDEX idx_sales_promotion ON sales(promotion_flag) WHERE promotion_flag = TRUE;  -- Partial index

-- Inventory
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_low_stock ON inventory(product_id) 
    WHERE stock_quantity <= safety_stock;  -- Partial index cho cảnh báo tồn kho

-- Suppliers
CREATE INDEX idx_suppliers_product_id ON suppliers(product_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = TRUE;  -- Partial index
CREATE INDEX idx_suppliers_name ON suppliers(supplier_name);

-- Market
CREATE INDEX idx_market_product_id ON market(product_id);
CREATE INDEX idx_market_date ON market(market_date);
CREATE INDEX idx_market_product_date ON market(product_id, market_date);  -- Composite index

-- Users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- AHP Configurations
CREATE INDEX idx_ahp_user ON ahp_configurations(user_id);

-- Forecast Results
CREATE INDEX idx_forecast_product ON forecast_results(product_id);
CREATE INDEX idx_forecast_date ON forecast_results(forecast_date);

-- GenAI Conversations
CREATE INDEX idx_genai_user ON genai_conversations(user_id);
CREATE INDEX idx_genai_created ON genai_conversations(created_at);

-- Trigger function cập nhật trường updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng cho các bảng có trường updated_at
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trg_ahp_updated BEFORE UPDATE ON ahp_configurations
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
