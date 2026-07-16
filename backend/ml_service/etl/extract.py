import pandas as pd
import logging

logger = logging.getLogger(__name__)

class DataExtractor:
    """
    Trích xuất dữ liệu thô từ nhiều nguồn vào Bronze Layer.
    """
    
    def extract_sales_csv(self, file_path: str) -> pd.DataFrame:
        """Đọc file CSV bán hàng"""
        try:
            logger.info(f"Extracting sales data from {file_path}")
            df = pd.read_csv(file_path)
            return df
        except Exception as e:
            logger.error(f"Error extracting sales data: {str(e)}")
            raise e
    
    def extract_inventory_csv(self, file_path: str) -> pd.DataFrame:
        """Đọc file CSV tồn kho"""
        try:
            logger.info(f"Extracting inventory data from {file_path}")
            df = pd.read_csv(file_path)
            return df
        except Exception as e:
            logger.error(f"Error extracting inventory data: {str(e)}")
            raise e
    
    def extract_market_data(self, api_url: str) -> pd.DataFrame:
        """Gọi API lấy dữ liệu thị trường (giá, tỷ giá)"""
        try:
            logger.info(f"Extracting market data from API {api_url}")
            # Mock API call using requests
            # return pd.read_json(api_url)
            return pd.DataFrame() # Placeholder
        except Exception as e:
            logger.error(f"Error extracting market data: {str(e)}")
            raise e
            
    def extract_all(self, sales_path: str, inventory_path: str, market_url: str) -> dict:
        """Trích xuất tất cả nguồn dữ liệu"""
        return {
            'sales': self.extract_sales_csv(sales_path),
            'inventory': self.extract_inventory_csv(inventory_path),
            'market': self.extract_market_data(market_url)
        }
