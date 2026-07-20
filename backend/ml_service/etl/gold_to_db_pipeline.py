import pandas as pd
import numpy as np
import os
import logging
import random
from datetime import datetime
from config.database import query_db

logger = logging.getLogger(__name__)

NODE_API_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'node_api'))

def process_gold_to_db(silver_file_path_relative: str) -> dict:
    """
    Đồng bộ dữ liệu từ file Silver CSV vào PostgreSQL database.
    (Sử dụng Silver data vì nó đã sạch và giữ nguyên giá trị thực,
    trong khi Gold data chứa features engineered + one-hot encoded không phù hợp cho display).
    """
    try:
        abs_silver_path = os.path.join(NODE_API_BASE, silver_file_path_relative)
        
        if not os.path.exists(abs_silver_path):
            raise FileNotFoundError(f"Không tìm thấy file: {abs_silver_path}")

        logger.info(f"Reading data for DB sync from: {abs_silver_path}")
        df = pd.read_csv(abs_silver_path)

        # Remove the category CHECK constraint if it exists to allow new dataset categories
        try:
            logger.info("Dropping category check constraint on products table if it exists...")
            constraints = query_db("""
                SELECT conname
                FROM pg_constraint
                JOIN pg_class ON conrelid = pg_class.oid
                JOIN pg_attribute ON attrelid = conrelid AND attnum = ANY(conkey)
                WHERE pg_class.relname = 'products' AND attname = 'category' AND contype = 'c';
            """)
            if constraints:
                for row in constraints:
                    conname = row['conname']
                    logger.info(f"Dropping constraint {conname}...")
                    query_db(f'ALTER TABLE products DROP CONSTRAINT IF EXISTS {conname}')
        except Exception as e:
            logger.warning(f"Failed to drop constraint (it might not exist or permission denied): {e}")

        # Truncate tables for a fresh start based on this CSV
        # Cảnh báo: Điều này xóa toàn bộ dữ liệu hiện tại để thay thế bằng file CSV mới.
        # Phù hợp với flow "User mở website lần đầu -> upload CSV -> phân tích".
        logger.info("Truncating existing tables to load new CSV data...")
        query_db('TRUNCATE TABLE market, sales, inventory, suppliers, products RESTART IDENTITY CASCADE')

        # 1. Insert Products
        # CSV columns: transaction_id, product_name, category, quantity, unit_price, sale_date, customer_rating, status, supplier_name
        products_df = df[['product_name', 'category']].drop_duplicates()
        products_map = {}  # Mapping product_name -> product_id
        
        logger.info(f"Inserting {len(products_df)} products...")
        for _, row in products_df.iterrows():
            product_name = str(row['product_name'])
            category = str(row['category']) if pd.notna(row['category']) else 'Unknown'
            brand = product_name.split(' ')[0] if ' ' in product_name else product_name  # Guess brand
            
            # Determine lifecycle_stage based on product type
            lifecycle_map = {
                'RTX 4090': 'growth', 'RTX 4080': 'growth', 'RTX 3060': 'maturity',
                'RX 7900 XTX': 'growth', 'Intel Core i9': 'growth', 'Intel Core i7': 'maturity',
                'AMD Ryzen 9': 'growth', 'AMD Ryzen 7': 'maturity',
                '32GB DDR5': 'growth', '16GB DDR4': 'maturity', '64GB DDR5': 'introduction',
                '2TB SSD': 'growth', '1TB SSD': 'maturity', '4TB HDD': 'decline',
                'Z790 MB': 'growth', 'B650 MB': 'growth', 'X670E MB': 'growth',
                '27-inch 4K': 'growth', '24-inch 1080p': 'maturity', '34-inch Ultrawide': 'growth',
                'Gaming Laptop': 'growth', 'Ultrabook': 'maturity', 'Business Laptop': 'maturity',
                'Mechanical Keyboard': 'maturity', 'Wireless Mouse': 'maturity', 'Gaming Headset': 'growth',
            }
            lifecycle = lifecycle_map.get(product_name, 'growth')
            
            result = query_db("""
                INSERT INTO products (product_name, category, brand, lifecycle_stage, description)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING product_id;
            """, (product_name, category, brand, lifecycle, f"{category} - {product_name}"))
            
            if result and len(result) > 0:
                products_map[product_name] = result[0]['product_id']

        # 2. Insert Suppliers & Inventory for each product
        logger.info("Generating dynamic Suppliers and Inventory data...")
        for product_name, product_id in products_map.items():
            # Get sales statistics for this product
            product_sales = df[df['product_name'] == product_name]
            
            # Tính các thống kê từ dữ liệu bán hàng thực
            median_price = product_sales['unit_price'].median() if not product_sales['unit_price'].empty else 1_000_000
            median_price = max(1.0, float(median_price))
            
            total_qty_sold = product_sales['quantity'].sum() if 'quantity' in product_sales.columns else 100
            total_qty_sold = max(1, int(float(total_qty_sold)))
            
            avg_daily_qty = total_qty_sold / 365.0
            
            # Xác định supplier names từ dữ liệu thực (nếu có)
            unique_suppliers = product_sales['supplier_name'].unique() if 'supplier_name' in product_sales.columns else []
            
            if len(unique_suppliers) >= 2:
                main_supplier_name = unique_suppliers[0]
                backup_supplier_name = unique_suppliers[1]
            elif len(unique_suppliers) == 1:
                main_supplier_name = unique_suppliers[0]
                backup_supplier_name = f"Backup ({product_name})"
            else:
                main_supplier_name = f"Main Supplier ({product_name})"
                backup_supplier_name = f"Backup Supplier ({product_name})"
            
            # Main supplier: giá thấp hơn, lead time ngắn, chất lượng cao
            main_defect = round(random.uniform(0.005, 0.025), 4)
            main_reliability = round(random.uniform(85, 98), 2)
            main_lead_time = random.randint(3, 7)
            
            # Backup supplier: giá cao hơn chút, lead time dài hơn, chất lượng thấp hơn chút
            backup_defect = round(random.uniform(0.015, 0.050), 4)
            backup_reliability = round(random.uniform(72, 90), 2)
            backup_lead_time = random.randint(5, 12)
            
            query_db("""
                INSERT INTO suppliers (supplier_name, price, lead_time, defect_rate, reliability_score, product_id)
                VALUES 
                (%s, %s, %s, %s, %s, %s),
                (%s, %s, %s, %s, %s, %s)
            """, (
                main_supplier_name, round(median_price * 0.70, 2), main_lead_time, main_defect, main_reliability, product_id,
                backup_supplier_name, round(median_price * 0.75, 2), backup_lead_time, backup_defect, backup_reliability, product_id
            ))
            
            # Inventory - tính toán hợp lý dựa trên dữ liệu bán hàng
            # Safety stock = Z * σ * √(L) with Z=1.645 (95%), σ = std of daily demand, L = lead_time
            daily_quantities = product_sales.groupby('sale_date')['quantity'].sum()
            if len(daily_quantities) > 1:
                demand_std = float(daily_quantities.std())
            else:
                demand_std = avg_daily_qty * 0.3
            demand_std = max(0.5, demand_std)
            
            avg_lead = (main_lead_time + backup_lead_time) / 2
            safety_stock = max(5, int(np.ceil(1.645 * demand_std * np.sqrt(avg_lead))))
            
            # Current stock: random nhưng realistic (khoảng 1-3 tuần bán hàng)
            stock_quantity = max(10, int(avg_daily_qty * random.randint(7, 21)))
            
            # Ordering cost: chi phí mỗi lần đặt hàng (VND) - tỷ lệ với giá sản phẩm
            ordering_cost = max(200_000, round(median_price * 0.03, -3))  # ~3% giá sản phẩm, tối thiểu 200K
            ordering_cost = min(ordering_cost, 2_000_000)  # Tối đa 2M
            
            # Holding cost per unit per year: ~5-15% giá sản phẩm
            holding_pct = random.uniform(0.05, 0.15)
            holding_cost = max(5_000, round(median_price * holding_pct, -3))
            
            query_db("""
                INSERT INTO inventory (product_id, stock_quantity, safety_stock, warehouse_id, ordering_cost, holding_cost_per_unit)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                product_id, 
                stock_quantity, 
                safety_stock, 
                1, 
                ordering_cost, 
                holding_cost
            ))

        # 3. Insert Sales
        logger.info("Inserting sales transactions...")
        # Chỉ lấy Completed và Pending (loại bỏ Cancelled vì không phải doanh số thực)
        if 'status' in df.columns:
            sales_to_insert = df[df['status'].str.lower().isin(['completed', 'pending'])]
        else:
            sales_to_insert = df
        
        sales_count = 0
        
        for _, row in sales_to_insert.iterrows():
            product_name = row['product_name']
            if product_name not in products_map:
                continue
                
            product_id = products_map[product_name]
            
            try:
                quantity_sold = int(float(row['quantity'])) if 'quantity' in row and pd.notna(row['quantity']) else 1
            except (ValueError, TypeError):
                quantity_sold = 1
            quantity_sold = max(1, quantity_sold)
            
            try:
                unit_price = float(row['unit_price']) if 'unit_price' in row and pd.notna(row['unit_price']) else 0
            except (ValueError, TypeError):
                unit_price = 0.0
            unit_price = max(0.0, unit_price)
            revenue = quantity_sold * unit_price
            
            sale_date = row['sale_date'] if 'sale_date' in row and pd.notna(row['sale_date']) else datetime.now().strftime('%Y-%m-%d')
            
            # Xác định promotion flag: giá thấp hơn 80% median → có promotion
            product_median = df[df['product_name'] == product_name]['unit_price'].median()
            promotion_flag = unit_price < (product_median * 0.80) if product_median > 0 else False
            
            query_db("""
                INSERT INTO sales (product_id, quantity_sold, sale_date, revenue, promotion_flag)
                VALUES (%s, %s, %s, %s, %s)
            """, (product_id, quantity_sold, sale_date, revenue, bool(promotion_flag)))
            sales_count += 1
            
        logger.info(f"Successfully inserted {sales_count} sales records.")

        return {
            "success": True,
            "products_inserted": len(products_map),
            "sales_inserted": sales_count,
            "message": "Database synchronized successfully with CSV data."
        }

    except Exception as e:
        logger.error(f"Error in gold_to_db pipeline: {str(e)}")
        raise e
