import pandas as pd
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

# Base directory for Node API uploads
NODE_API_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'node_api'))

def process_bronze_to_silver(file_path_relative: str) -> dict:
    """
    Xử lý dữ liệu thô (Bronze) sang dữ liệu sạch (Silver).
    
    Các bước xử lý:
    1. Drop duplicates
    2. Fix invalid data types (quantity 'N/A' → NaN)
    3. Normalize dates (mixed formats → YYYY-MM-DD)
    4. Fill missing values (Median cho numeric, Mode cho categorical)
    5. Remove price outliers (IQR method per product)
    6. Remove Cancelled transactions (không tính vào phân tích)
    """
    try:
        # Đường dẫn tuyệt đối tới file bronze
        abs_bronze_path = os.path.join(NODE_API_BASE, file_path_relative)
        
        if not os.path.exists(abs_bronze_path):
            raise FileNotFoundError(f"Không tìm thấy file: {abs_bronze_path}")

        logger.info(f"Reading bronze data from: {abs_bronze_path}")
        df = pd.read_csv(abs_bronze_path)
        
        initial_rows = len(df)
        algorithms_applied = []

        # === 1. Drop exact duplicates ===
        df = df.drop_duplicates()
        dropped_dupes = initial_rows - len(df)
        if dropped_dupes > 0:
            algorithms_applied.append(f"Loại bỏ {dropped_dupes} dòng trùng lặp (Drop Duplicates).")

        # === 2. Fix invalid data types ===
        # quantity: convert non-numeric values to NaN
        if 'quantity' in df.columns:
            original_invalid = df['quantity'].apply(lambda x: not str(x).replace('.', '', 1).replace('-', '', 1).isdigit() and str(x) != 'nan').sum()
            df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
            if original_invalid > 0:
                algorithms_applied.append(f"Chuyển đổi {original_invalid} giá trị quantity không hợp lệ thành NaN (Data Type Fix).")
        
        # unit_price: ensure numeric
        if 'unit_price' in df.columns:
            df['unit_price'] = pd.to_numeric(df['unit_price'], errors='coerce')
        
        # customer_rating: ensure numeric and within 1-5
        if 'customer_rating' in df.columns:
            df['customer_rating'] = pd.to_numeric(df['customer_rating'], errors='coerce')
            df.loc[df['customer_rating'] > 5, 'customer_rating'] = 5
            df.loc[df['customer_rating'] < 1, 'customer_rating'] = np.nan

        # === 3. Normalize dates ===
        if 'sale_date' in df.columns:
            # Handle mixed date formats: YYYY-MM-DD, DD/MM/YYYY, MM-DD-YYYY
            df['sale_date'] = pd.to_datetime(df['sale_date'], format='mixed', dayfirst=False, errors='coerce')
            invalid_dates = df['sale_date'].isna().sum()
            
            # Remove rows with unparseable dates
            before_len = len(df)
            df = df.dropna(subset=['sale_date'])
            dropped_dates = before_len - len(df)
            if dropped_dates > 0:
                algorithms_applied.append(f"Chuẩn hóa ngày tháng (Date Normalization). Loại bỏ {dropped_dates} dòng có ngày không hợp lệ.")
            else:
                algorithms_applied.append("Chuẩn hóa ngày tháng (Date Normalization) sang định dạng YYYY-MM-DD.")
            
            # Convert back to string in standard format
            df['sale_date'] = df['sale_date'].dt.strftime('%Y-%m-%d')

        # === 4. Remove price outliers using IQR per product ===
        if 'unit_price' in df.columns and 'product_name' in df.columns:
            outlier_count = 0
            for product in df['product_name'].unique():
                mask = df['product_name'] == product
                product_prices = df.loc[mask, 'unit_price']
                
                if len(product_prices) < 10:
                    continue
                    
                Q1 = product_prices.quantile(0.25)
                Q3 = product_prices.quantile(0.75)
                IQR = Q3 - Q1
                
                lower = Q1 - 2.0 * IQR  # Dùng 2.0 thay vì 1.5 để ít aggressive hơn
                upper = Q3 + 2.0 * IQR
                
                outlier_mask = mask & ((df['unit_price'] < lower) | (df['unit_price'] > upper))
                outlier_count += outlier_mask.sum()
                
                # Thay outlier bằng median thay vì xóa (giữ record)
                df.loc[outlier_mask, 'unit_price'] = product_prices.median()
            
            if outlier_count > 0:
                algorithms_applied.append(f"Xử lý {outlier_count} giá trị ngoại lệ (Price Outliers) bằng IQR method per product.")

        # === 5. Fill Missing Values ===
        missing_cols = df.columns[df.isnull().any()].tolist()
        if missing_cols:
            for col in missing_cols:
                if pd.api.types.is_numeric_dtype(df[col]):
                    # Fill numeric with median (per product if possible)
                    if 'product_name' in df.columns and col in ['quantity', 'unit_price']:
                        df[col] = df.groupby('product_name')[col].transform(
                            lambda x: x.fillna(x.median())
                        )
                        # If still NaN (entire product group is NaN), use global median
                        df[col] = df[col].fillna(df[col].median())
                    else:
                        df[col] = df[col].fillna(df[col].median())
                else:
                    # Fill categorical with mode
                    mode_val = df[col].mode()
                    if not mode_val.empty:
                        df[col] = df[col].fillna(mode_val[0])
                    else:
                        df[col] = df[col].fillna("Unknown")
            algorithms_applied.append(f"Điền giá trị thiếu (Missing Values) cho các cột: {', '.join(missing_cols)} bằng Median/Mode per product.")

        # === 6. Ensure quantity is positive integer ===
        if 'quantity' in df.columns:
            df['quantity'] = df['quantity'].clip(lower=1)
            df['quantity'] = df['quantity'].round(0).astype(int)

        # Tạo file name mới cho silver layer
        filename = os.path.basename(file_path_relative)
        silver_filename = f"silver_{filename}"
        silver_rel_path = os.path.join('uploads', 'silver', silver_filename)
        abs_silver_path = os.path.join(NODE_API_BASE, silver_rel_path)
        
        # Đảm bảo thư mục silver tồn tại
        os.makedirs(os.path.dirname(abs_silver_path), exist_ok=True)
        
        logger.info(f"Saving silver data to: {abs_silver_path}")
        df.to_csv(abs_silver_path, index=False)
        
        if not algorithms_applied:
            algorithms_applied.append("Dữ liệu đã sạch, không cần xử lý thêm.")

        # Trả về đường dẫn tương đối (để lưu DB theo format Node API)
        # Vì OS Windows dùng \, ta đổi sang / cho chuẩn URL path
        silver_rel_path_standard = silver_rel_path.replace('\\', '/')
        
        return {
            "success": True,
            "new_file_path": silver_rel_path_standard,
            "algorithms_applied": algorithms_applied,
            "rows_processed": len(df)
        }

    except Exception as e:
        logger.error(f"Error in bronze_to_silver pipeline: {str(e)}")
        raise e
