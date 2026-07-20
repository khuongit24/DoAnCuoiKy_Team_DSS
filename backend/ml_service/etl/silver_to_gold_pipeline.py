import pandas as pd
import numpy as np
import os
import logging

logger = logging.getLogger(__name__)

NODE_API_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'node_api'))

def process_silver_to_gold(file_path_relative: str) -> dict:
    """
    Xử lý dữ liệu làm sạch (Silver) sang dữ liệu tinh chỉnh (Gold).
    
    THAY ĐỔI QUAN TRỌNG so với phiên bản cũ:
    - KHÔNG dùng StandardScaler (vì scale phá hủy giá trị thực của unit_price, quantity).
    - Thay vào đó: tạo features hữu ích cho ML (time features, lag, rolling stats, seasonal flags).
    - One-hot encoding chỉ cho categorical columns (category, supplier_name, status).
    - Giữ nguyên tất cả cột gốc quan trọng.
    """
    try:
        abs_silver_path = os.path.join(NODE_API_BASE, file_path_relative)
        
        if not os.path.exists(abs_silver_path):
            raise FileNotFoundError(f"Không tìm thấy file: {abs_silver_path}")

        logger.info(f"Reading silver data from: {abs_silver_path}")
        df = pd.read_csv(abs_silver_path)
        
        algorithms_applied = []

        # === 1. TIME FEATURES ===
        if 'sale_date' in df.columns:
            df['sale_date'] = pd.to_datetime(df['sale_date'], format='mixed', errors='coerce')
            # Loại bỏ rows với date invalid
            before_len = len(df)
            df = df.dropna(subset=['sale_date'])
            dropped_dates = before_len - len(df)
            if dropped_dates > 0:
                algorithms_applied.append(f"Loại bỏ {dropped_dates} dòng có ngày không hợp lệ.")
            
            df['day_of_week'] = df['sale_date'].dt.dayofweek
            df['month'] = df['sale_date'].dt.month
            df['quarter'] = df['sale_date'].dt.quarter
            df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
            df['day_of_month'] = df['sale_date'].dt.day
            algorithms_applied.append("Tạo features thời gian: day_of_week, month, quarter, is_weekend, day_of_month.")

        # === 2. SEASONAL FLAGS ===
        if 'month' in df.columns:
            df['back_to_school'] = df['month'].apply(lambda x: 1 if x in [8, 9] else 0)
            df['year_end'] = df['month'].apply(lambda x: 1 if x == 12 else 0)
            df['black_friday'] = df['month'].apply(lambda x: 1 if x == 11 else 0)
            df['tet_holiday'] = df['month'].apply(lambda x: 1 if x in [1, 2] else 0)
            algorithms_applied.append("Tạo seasonal flags: back_to_school, year_end, black_friday, tet_holiday.")

        # === 3. LAG FEATURES & ROLLING STATS (per product) ===
        if 'quantity' in df.columns and 'product_name' in df.columns and 'sale_date' in df.columns:
            # Ensure quantity is numeric
            df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
            
            # Sort by product and date for proper lag/rolling calculation
            df = df.sort_values(['product_name', 'sale_date']).reset_index(drop=True)
            
            # Aggregate daily sales per product first for lag features
            # (since there can be multiple transactions per day per product)
            daily_sales = df.groupby(['product_name', 'sale_date'])['quantity'].sum().reset_index()
            daily_sales = daily_sales.rename(columns={'quantity': 'daily_total_quantity'})
            daily_sales = daily_sales.sort_values(['product_name', 'sale_date']).reset_index(drop=True)
            
            # Create lag features on daily aggregated data
            for lag in [1, 7, 30]:
                daily_sales[f'quantity_sold_lag_{lag}'] = daily_sales.groupby('product_name')['daily_total_quantity'].shift(lag)
            
            # Create rolling features on daily aggregated data
            for window in [7, 30]:
                daily_sales[f'rolling_mean_{window}'] = daily_sales.groupby('product_name')['daily_total_quantity'].transform(
                    lambda x: x.rolling(window, min_periods=1).mean()
                )
                daily_sales[f'rolling_std_{window}'] = daily_sales.groupby('product_name')['daily_total_quantity'].transform(
                    lambda x: x.rolling(window, min_periods=1).std()
                )
                daily_sales[f'rolling_std_{window}'] = daily_sales[f'rolling_std_{window}'].fillna(0)
            
            # Merge lag/rolling features back to main dataframe
            lag_cols = [c for c in daily_sales.columns if 'lag_' in c or 'rolling_' in c]
            merge_cols = ['product_name', 'sale_date'] + lag_cols
            df = df.merge(daily_sales[merge_cols], on=['product_name', 'sale_date'], how='left')
            
            # Fill NaN lag values with 0 (early data points)
            for col in lag_cols:
                df[col] = df[col].fillna(0)
            
            algorithms_applied.append(f"Tạo lag features (1, 7, 30 ngày) và rolling statistics (mean, std cho 7 và 30 ngày) per product.")

        # === 4. CATEGORICAL ENCODING (One-hot) ===
        # Chỉ encode các cột phân loại có số lượng unique values < 20
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        # Exclude transaction_id, product_name (high cardinality) và sale_date
        cols_to_exclude = ['transaction_id', 'product_name', 'sale_date']
        cols_to_encode = [col for col in categorical_cols 
                          if col not in cols_to_exclude 
                          and df[col].nunique() < 20]
        
        if cols_to_encode:
            df = pd.get_dummies(df, columns=cols_to_encode, drop_first=True)
            algorithms_applied.append(f"One-Hot Encoding cho các cột phân loại: {', '.join(cols_to_encode)}.")
            
        if not algorithms_applied:
            algorithms_applied.append("Dữ liệu không cần tinh chỉnh thêm.")

        # === 5. Convert sale_date back to string for CSV storage ===
        if 'sale_date' in df.columns:
            df['sale_date'] = df['sale_date'].dt.strftime('%Y-%m-%d')

        # Tạo file name mới cho gold layer
        filename = os.path.basename(file_path_relative)
        if filename.startswith('silver_'):
            gold_filename = filename.replace('silver_', 'gold_', 1)
        else:
            gold_filename = f"gold_{filename}"
            
        gold_rel_path = os.path.join('uploads', 'gold', gold_filename)
        abs_gold_path = os.path.join(NODE_API_BASE, gold_rel_path)
        
        # Đảm bảo thư mục gold tồn tại
        os.makedirs(os.path.dirname(abs_gold_path), exist_ok=True)
        
        logger.info(f"Saving gold data to: {abs_gold_path}")
        df.to_csv(abs_gold_path, index=False)

        gold_rel_path_standard = gold_rel_path.replace('\\', '/')
        
        return {
            "success": True,
            "new_file_path": gold_rel_path_standard,
            "algorithms_applied": algorithms_applied,
            "features_engineered": len(df.columns)
        }

    except Exception as e:
        logger.error(f"Error in silver_to_gold pipeline: {str(e)}")
        raise e
