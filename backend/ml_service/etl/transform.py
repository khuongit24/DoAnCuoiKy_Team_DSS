import pandas as pd
import logging

logger = logging.getLogger(__name__)

class DataTransformer:
    """
    Xử lý dữ liệu Bronze → Silver Layer.
    """
    
    def remove_duplicates(self, df: pd.DataFrame, subset: list) -> pd.DataFrame:
        """Xóa bản ghi trùng lặp dựa trên subset cột"""
        try:
            original_len = len(df)
            df_cleaned = df.drop_duplicates(subset=subset, keep='last')
            logger.info(f"Removed {original_len - len(df_cleaned)} duplicates.")
            return df_cleaned
        except Exception as e:
            logger.error(f"Error removing duplicates: {str(e)}")
            raise e
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Xử lý giá trị null"""
        try:
            df_cleaned = df.copy()
            for col in df_cleaned.columns:
                if df_cleaned[col].dtype in ['float64', 'int64']:
                    # Numeric columns: Điền bằng median
                    df_cleaned[col] = df_cleaned[col].fillna(df_cleaned[col].median())
                elif df_cleaned[col].dtype == 'object':
                    # Categorical columns: Điền bằng mode, handle cases where mode is empty
                    mode_val = df_cleaned[col].mode()
                    if not mode_val.empty:
                        df_cleaned[col] = df_cleaned[col].fillna(mode_val[0])
                elif 'datetime' in str(df_cleaned[col].dtype):
                    # Date columns: Drop rows where date is missing
                    df_cleaned = df_cleaned.dropna(subset=[col])
            logger.info("Handled missing values.")
            return df_cleaned
        except Exception as e:
            logger.error(f"Error handling missing values: {str(e)}")
            raise e
    
    def normalize_dates(self, df: pd.DataFrame, date_col: str) -> pd.DataFrame:
        """Chuẩn hóa tất cả date về format YYYY-MM-DD"""
        try:
            if date_col in df.columns:
                df[date_col] = pd.to_datetime(df[date_col], format='mixed', errors='coerce').dt.date
                df = df.dropna(subset=[date_col]) # drop rows where date parsing failed
                logger.info(f"Normalized dates in column {date_col}.")
            return df
        except Exception as e:
            logger.error(f"Error normalizing dates: {str(e)}")
            raise e
    
    def remove_outliers(self, df: pd.DataFrame, col: str, method: str = 'iqr') -> pd.DataFrame:
        """Loại bỏ outlier bằng IQR method"""
        try:
            if col not in df.columns:
                return df
                
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            original_len = len(df)
            df_cleaned = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
            logger.info(f"Removed {original_len - len(df_cleaned)} outliers from column {col}.")
            return df_cleaned
        except Exception as e:
            logger.error(f"Error removing outliers: {str(e)}")
            raise e
            
    def transform_all(self, raw_data: dict) -> dict:
        """Chạy toàn bộ pipeline transform"""
        logger.info("Starting transformation pipeline.")
        transformed = {}
        
        # Transform sales
        if 'sales' in raw_data and not raw_data['sales'].empty:
            df_sales = raw_data['sales']
            # Example subset
            df_sales = self.remove_duplicates(df_sales, subset=['date', 'product_id'] if 'date' in df_sales.columns else None)
            df_sales = self.handle_missing_values(df_sales)
            df_sales = self.normalize_dates(df_sales, 'date')
            df_sales = self.remove_outliers(df_sales, 'quantity_sold')
            transformed['sales'] = df_sales
            
        # Transform inventory (simplified logic for now)
        if 'inventory' in raw_data and not raw_data['inventory'].empty:
            df_inv = raw_data['inventory']
            df_inv = self.remove_duplicates(df_inv, subset=None)
            df_inv = self.handle_missing_values(df_inv)
            transformed['inventory'] = df_inv
            
        # Transform market (simplified)
        if 'market' in raw_data and not raw_data['market'].empty:
            df_market = raw_data['market']
            df_market = self.handle_missing_values(df_market)
            transformed['market'] = df_market
            
        return transformed
