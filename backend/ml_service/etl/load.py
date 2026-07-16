import pandas as pd
import logging
import psycopg2
from sqlalchemy import create_engine
import os

logger = logging.getLogger(__name__)

class DataLoader:
    """
    Tạo features từ Silver data và nạp vào PostgreSQL (Gold Layer).
    """
    
    def __init__(self, db_url: str = None):
        self.db_url = db_url or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/dss_electronics")
        if self.db_url:
            self.engine = create_engine(self.db_url)
        else:
            self.engine = None
    
    def create_time_features(self, df: pd.DataFrame, date_col: str = 'date') -> pd.DataFrame:
        """Tạo features thời gian: day_of_week, month, quarter, is_weekend"""
        try:
            if date_col not in df.columns:
                return df
            # Ensure datetime
            df[date_col] = pd.to_datetime(df[date_col])
            df['day_of_week'] = df[date_col].dt.dayofweek
            df['month'] = df[date_col].dt.month
            df['quarter'] = df[date_col].dt.quarter
            df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
            logger.info("Created time features.")
            return df
        except Exception as e:
            logger.error(f"Error creating time features: {str(e)}")
            raise e
    
    def create_lag_features(self, df: pd.DataFrame, target_col: str, lags: list = [1, 7, 30]) -> pd.DataFrame:
        """Tạo lag features cho time series prediction"""
        try:
            if target_col not in df.columns:
                return df
                
            # Assume data is sorted by date before calling this
            for lag in lags:
                df[f'{target_col}_lag_{lag}'] = df.groupby('product_id')[target_col].shift(lag)
            logger.info(f"Created lag features for {target_col}.")
            return df
        except Exception as e:
            logger.error(f"Error creating lag features: {str(e)}")
            raise e
    
    def create_rolling_features(self, df: pd.DataFrame, target_col: str, windows: list = [7, 30]) -> pd.DataFrame:
        """Tạo rolling mean, rolling std cho demand"""
        try:
            if target_col not in df.columns:
                return df
                
            for window in windows:
                df[f'rolling_mean_{window}'] = df.groupby('product_id')[target_col].transform(lambda x: x.rolling(window, min_periods=1).mean())
                df[f'rolling_std_{window}'] = df.groupby('product_id')[target_col].transform(lambda x: x.rolling(window, min_periods=1).std())
                # Handle NaNs from rolling std
                df[f'rolling_std_{window}'] = df[f'rolling_std_{window}'].fillna(0)
            logger.info(f"Created rolling features for {target_col}.")
            return df
        except Exception as e:
            logger.error(f"Error creating rolling features: {str(e)}")
            raise e
    
    def create_seasonal_flags(self, df: pd.DataFrame) -> pd.DataFrame:
        """Đánh dấu mùa vụ"""
        try:
            if 'month' not in df.columns:
                return df
            # back_to_school: tháng 8-9
            df['back_to_school'] = df['month'].apply(lambda x: 1 if x in [8, 9] else 0)
            # year_end: tháng 12
            df['year_end'] = df['month'].apply(lambda x: 1 if x == 12 else 0)
            # black_friday: simplified to November
            df['black_friday'] = df['month'].apply(lambda x: 1 if x == 11 else 0)
            logger.info("Created seasonal flags.")
            return df
        except Exception as e:
            logger.error(f"Error creating seasonal flags: {str(e)}")
            raise e
    
    def load_to_postgres(self, df: pd.DataFrame, table_name: str, if_exists: str = 'append'):
        """Nạp dữ liệu đã xử lý vào PostgreSQL"""
        try:
            if self.engine is None:
                logger.warning("No database engine configured. Skipping load to PostgreSQL.")
                return
            df.to_sql(table_name, self.engine, if_exists=if_exists, index=False)
            logger.info(f"Loaded {len(df)} rows into table {table_name}.")
        except Exception as e:
            logger.error(f"Error loading to postgres: {str(e)}")
            raise e
            
    def process_and_load(self, silver_data: dict):
        if 'sales' in silver_data:
            df = silver_data['sales']
            df = df.sort_values(by=['product_id', 'date'])
            df = self.create_time_features(df, 'date')
            df = self.create_lag_features(df, 'quantity_sold')
            df = self.create_rolling_features(df, 'quantity_sold')
            df = self.create_seasonal_flags(df)
            
            # Load to DB
            self.load_to_postgres(df, 'gold_sales_features', if_exists='replace')
