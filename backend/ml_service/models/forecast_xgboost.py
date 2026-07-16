import pandas as pd
import xgboost as xgb
import joblib
import logging

logger = logging.getLogger(__name__)

xgb_params = {
    'objective': 'reg:squarederror',
    'n_estimators': 500,
    'max_depth': 6,
    'learning_rate': 0.05,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 3,
    'reg_alpha': 0.1,       # L1 regularization
    'reg_lambda': 1.0,      # L2 regularization
    'early_stopping_rounds': 50,
    'random_state': 42
}

class XGBoostForecaster:
    def __init__(self):
        self.model = None
        # Must match Gold layer features
        self.feature_columns = [
            'quantity_sold_lag_1', 'quantity_sold_lag_7', 'quantity_sold_lag_30',
            'rolling_mean_7', 'rolling_mean_30', 'rolling_std_7',
            'day_of_week', 'month', 'quarter', 'is_weekend',
            'back_to_school', 'year_end', 'black_friday'
        ]
    
    def train(self, train_data: pd.DataFrame, val_data: pd.DataFrame):
        """
        Huấn luyện mô hình XGBoost
        """
        try:
            logger.info("Training XGBoost model...")
            # Handle missing columns safely
            actual_features = [col for col in self.feature_columns if col in train_data.columns]
            
            X_train = train_data[actual_features]
            y_train = train_data['quantity_sold']
            X_val = val_data[actual_features]
            y_val = val_data['quantity_sold']
            
            self.model = xgb.XGBRegressor(**xgb_params)
            self.model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            logger.info("Training completed.")
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise e
    
    def predict(self, features: pd.DataFrame, horizon: int = 30) -> list:
        """Dự báo nhu cầu cho horizon ngày tới"""
        try:
            if self.model is None:
                raise ValueError("Model has not been trained or loaded yet.")
            
            actual_features = [col for col in self.feature_columns if col in features.columns]
            
            predictions = []
            # For simplistic batch prediction, assume features DataFrame has 'horizon' rows
            # A true recursive forecasting would update lag features per day step
            for day in range(min(horizon, len(features))):
                pred = self.model.predict(features[actual_features].iloc[[day]])[0]
                predictions.append(max(0, round(float(pred))))  # Demand cannot be negative
                
            return predictions
        except Exception as e:
            logger.error(f"Error predicting: {str(e)}")
            raise e
    
    def save_model(self, path: str):
        """Lưu mô hình vào file .pkl"""
        try:
            joblib.dump(self.model, path)
            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise e
    
    def load_model(self, path: str):
        """Tải mô hình từ file .pkl"""
        try:
            self.model = joblib.load(path)
            logger.info(f"Model loaded from {path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise e
