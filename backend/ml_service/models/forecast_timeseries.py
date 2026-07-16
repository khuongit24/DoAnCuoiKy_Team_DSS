import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
import joblib
import logging

logger = logging.getLogger(__name__)

class ARIMAForecaster:
    """
    ARIMA model cho sản phẩm có tính mùa vụ cao.
    Sử dụng SARIMAX (Seasonal ARIMA).
    """
    
    def __init__(self, order=(1,1,1), seasonal_order=(1,1,1,12)):
        self.order = order
        self.seasonal_order = seasonal_order
        self.model = None
        self.fitted_model = None
    
    def train(self, time_series: pd.Series):
        """Huấn luyện SARIMAX model"""
        try:
            logger.info("Training SARIMAX model...")
            self.model = SARIMAX(
                time_series,
                order=self.order,
                seasonal_order=self.seasonal_order,
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            self.fitted_model = self.model.fit(disp=False)
            logger.info("Training completed.")
        except Exception as e:
            logger.error(f"Error training SARIMAX model: {str(e)}")
            raise e
    
    def predict(self, horizon: int = 30) -> tuple:
        """Dự báo horizon bước tiếp theo"""
        try:
            if self.fitted_model is None:
                raise ValueError("Model has not been trained yet.")
                
            forecast = self.fitted_model.get_forecast(steps=horizon)
            predictions = forecast.predicted_mean.tolist()
            # Ensure no negative predictions
            predictions = [max(0, round(float(p))) for p in predictions]
            
            # Simplified confidence bounds
            conf_int = forecast.conf_int()
            
            return predictions, conf_int.to_dict('records')
        except Exception as e:
            logger.error(f"Error predicting with SARIMAX: {str(e)}")
            raise e
            
    def save_model(self, path: str):
        try:
            joblib.dump(self.fitted_model, path)
            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise e
            
    def load_model(self, path: str):
        try:
            self.fitted_model = joblib.load(path)
            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise e
