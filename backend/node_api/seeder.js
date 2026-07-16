const { Client } = require('pg');
const config = require('./src/config/env');

async function seed() {
    const client = new Client({
        connectionString: config.db.url || 'postgresql://postgres:241104@localhost:5432/dss_electronics'
    });

    try {
        await client.connect();
        console.log('Connected to dss_electronics');

        // Create tables if they don't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                product_id SERIAL PRIMARY KEY,
                product_name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                brand VARCHAR(100),
                lifecycle_stage VARCHAR(50) DEFAULT 'growth',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS suppliers (
                supplier_id SERIAL PRIMARY KEY,
                supplier_name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2),
                lead_time INT,
                defect_rate DECIMAL(5,2),
                reliability_score DECIMAL(5,2),
                contact_email VARCHAR(255),
                contact_phone VARCHAR(20),
                product_id INT REFERENCES products(product_id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS inventory (
                inventory_id SERIAL PRIMARY KEY,
                product_id INT REFERENCES products(product_id),
                stock_quantity INT,
                safety_stock INT DEFAULT 0,
                warehouse_id INT,
                holding_cost_per_unit DECIMAL(10,2),
                ordering_cost DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sales (
                sales_id SERIAL PRIMARY KEY,
                product_id INT REFERENCES products(product_id),
                quantity_sold INT,
                revenue DECIMAL(15,2),
                sale_date DATE,
                promotion_flag BOOLEAN DEFAULT FALSE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS market (
                market_id SERIAL PRIMARY KEY,
                product_id INT REFERENCES products(product_id),
                market_price DECIMAL(10,2),
                exchange_rate DECIMAL(10,2),
                new_product_flag BOOLEAN DEFAULT FALSE,
                market_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Read products from JSON
        const fs = require('fs');
        const path = require('path');
        const mockProductsPath = path.join(__dirname, 'data', 'mock_products.json');
        const mockProducts = JSON.parse(fs.readFileSync(mockProductsPath, 'utf8'));

        // Clean up old data
        await client.query('TRUNCATE TABLE market, sales, inventory, suppliers, products RESTART IDENTITY CASCADE');
        console.log('Cleaned up existing data');

        // Insert Products
        const productsMap = {}; // mapping local array index to DB product_id
        for (let i = 0; i < mockProducts.length; i++) {
            const p = mockProducts[i];
            const result = await client.query(`
                INSERT INTO products (product_name, category, brand, lifecycle_stage, description)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING product_id;
            `, [p.product_name, p.category, p.brand, p.lifecycle_stage, 'Tech product']);
            productsMap[i] = result.rows[0].product_id;
        }
        console.log(`Inserted ${mockProducts.length} products`);

        // Insert Suppliers
        for (let i = 0; i < mockProducts.length; i++) {
            const dbProductId = productsMap[i];
            const p = mockProducts[i];
            const basePrice = p.base_price;
            
            await client.query(`
                INSERT INTO suppliers (supplier_name, price, lead_time, defect_rate, reliability_score, product_id)
                VALUES 
                ($1, $2, $3, $4, $5, $6),
                ($7, $8, $9, $10, $11, $12)
            `, [
                `Supplier A - ${p.brand}`, basePrice * 0.7, 3 + Math.floor(Math.random()*5), 0.01 + Math.random()*0.02, 90 + Math.random()*10, dbProductId,
                `Supplier B - ${p.brand}`, basePrice * 0.75, 5 + Math.floor(Math.random()*7), 0.02 + Math.random()*0.03, 85 + Math.random()*10, dbProductId
            ]);
        }
        console.log('Inserted suppliers');

        // Insert Inventory
        for (let i = 0; i < mockProducts.length; i++) {
            const dbProductId = productsMap[i];
            const p = mockProducts[i];
            const basePrice = p.base_price;
            await client.query(`
                INSERT INTO inventory (product_id, stock_quantity, safety_stock, warehouse_id, ordering_cost, holding_cost_per_unit)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                dbProductId, 
                20 + Math.floor(Math.random()*150), // Random stock 20 to 170
                20, 
                1, 
                500000, 
                basePrice * 0.05 // Holding cost 5% of price
            ]);
        }
        console.log('Inserted inventory');

        // Insert Sales (Daily data for the last 6 months for each product)
        let salesCount = 0;
        const today = new Date();
        for (let i = 180; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            for (let j = 0; j < mockProducts.length; j++) {
                const dbProductId = productsMap[j];
                const p = mockProducts[j];
                
                // Add some random chance to not sell every product every day
                if (Math.random() > 0.3) {
                    const baseQty = Math.floor(Math.random() * 5) + 1; // 1 to 5 items sold
                    const revenue = baseQty * p.base_price;
                    await client.query(`
                        INSERT INTO sales (product_id, quantity_sold, revenue, sale_date)
                        VALUES ($1, $2, $3, $4)
                    `, [dbProductId, baseQty, revenue, dateString]);
                    salesCount++;
                }
            }
        }
        console.log(`Inserted ${salesCount} sales records`);

        console.log('✅ Database seeded successfully!');
    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await client.end();
    }
}

seed();
