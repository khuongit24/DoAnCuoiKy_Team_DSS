const { query } = require('./src/config/database');
const fs = require('fs');

async function migrate() {
    try {
        console.log('Adding supplier_name column to products table...');
        await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255) DEFAULT 'Unknown'`);
        
        console.log('Updating products from mock data...');
        const mockData = JSON.parse(fs.readFileSync('./data/mock_products.json', 'utf8'));
        
        for (const item of mockData) {
            if (item.product_name && item.supplier_name) {
                await query(`UPDATE products SET supplier_name = $1 WHERE product_name = $2`, [item.supplier_name, item.product_name]);
            }
        }

        console.log('Updating suppliers table to use realistic names...');
        const { rows: suppliers } = await query(`SELECT supplier_id, supplier_name FROM suppliers`);
        const realisticNames = ['Mega Electronics', 'Local Distro', 'Tech Supplier A', 'Tech Supplier B', 'Global Hardware'];
        
        for (let i = 0; i < suppliers.length; i++) {
            const randomName = realisticNames[Math.floor(Math.random() * realisticNames.length)];
            await query(`UPDATE suppliers SET supplier_name = $1 WHERE supplier_id = $2`, [randomName, suppliers[i].supplier_id]);
        }
        
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
