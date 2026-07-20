import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import logging

logger = logging.getLogger(__name__)

rf_params = {
    'n_estimators': 200,
    'max_depth': 10,
    'min_samples_split': 5,
    'min_samples_leaf': 2,
    'random_state': 42
}

class RandomForestForecaster:
    def __init__(self):
        self.model = None
        # Must match Gold layer features
        self.feature_columns = [
            'quantity_sold_lag_1', 'quantity_sold_lag_7', 'quantity_sold_lag_30',
            'rolling_mean_7', 'rolling_mean_30', 'rolling_std_7',
            'day_of_week', 'month', 'quarter', 'is_weekend',
            'back_to_school', 'year_end', 'black_friday'
        ]
    
    @staticmethod
    def prepare_features_from_sales(sales_data: pd.DataFrame) -> pd.DataFrame:
        """
        Tạo features từ raw sales data (từ database).
        Input: DataFrame với columns [sale_date, quantity_sold] 
               (đã aggregate per day cho 1 product)
        Output: DataFrame với features sẵn sàng cho training/prediction
        """
        df = sales_data.copy()
        
        if df.empty:
            return df
            
        # Ensure datetime
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        df = df.sort_values('sale_date').reset_index(drop=True)
        
        # Ensure we have daily data (fill missing dates with 0 sales)
        date_range = pd.date_range(start=df['sale_date'].min(), end=df['sale_date'].max(), freq='D')
        full_dates = pd.DataFrame({'sale_date': date_range})
        df = full_dates.merge(df, on='sale_date', how='left')
        df['quantity_sold'] = df['quantity_sold'].fillna(0)
        
        # Time features
        df['day_of_week'] = df['sale_date'].dt.dayofweek
        df['month'] = df['sale_date'].dt.month
        df['quarter'] = df['sale_date'].dt.quarter
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        
        # Lag features
        for lag in [1, 7, 30]:
            df[f'quantity_sold_lag_{lag}'] = df['quantity_sold'].shift(lag)
        
        # Rolling features
        for window in [7, 30]:
            df[f'rolling_mean_{window}'] = df['quantity_sold'].rolling(window, min_periods=1).mean()
            df[f'rolling_std_{window}'] = df['quantity_sold'].rolling(window, min_periods=1).std().fillna(0)
        
        # Seasonal flags
        df['back_to_school'] = df['month'].apply(lambda x: 1 if x in [8, 9] else 0)
        df['year_end'] = df['month'].apply(lambda x: 1 if x == 12 else 0)
        df['black_friday'] = df['month'].apply(lambda x: 1 if x == 11 else 0)
        
        # Drop rows where lag features are NaN (first 30 days)
        df = df.dropna(subset=['quantity_sold_lag_30']).reset_index(drop=True)
        
        return df

    def train(self, train_data: pd.DataFrame, val_data: pd.DataFrame = None):
        """
        Huấn luyện mô hình XGBoost.
        Nếu val_data = None, tự động split 80/20 từ train_data.
        """
        try:
            logger.info("Training Random Forest model...")
            # Handle missing columns safely
            actual_features = [col for col in self.feature_columns if col in train_data.columns]
            
            if len(actual_features) == 0:
                raise ValueError("Không tìm thấy feature columns nào trong training data!")
            
            if val_data is None:
                # Auto-split: 80% train, 20% validation (time-based split)
                split_idx = int(len(train_data) * 0.8)
                val_data = train_data.iloc[split_idx:]
                train_data = train_data.iloc[:split_idx]
            
            X_train = train_data[actual_features]
            y_train = train_data['quantity_sold']
            X_val = val_data[actual_features]
            y_val = val_data['quantity_sold']
            
            self.model = RandomForestRegressor(**rf_params)
            self.model.fit(X_train, y_train)
            logger.info(f"Training completed. Features used: {len(actual_features)}, "
                        f"Train samples: {len(X_train)}, Val samples: {len(X_val)}")
            
            return {
                'features_used': actual_features,
                'train_samples': len(X_train),
                'val_samples': len(X_val)
            }
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise e
    
    def predict(self, features: pd.DataFrame, horizon: int = 30) -> list:
        """Dự báo nhu cầu cho horizon ngày tới bằng recursive forecasting"""
        try:
            if self.model is None:
                raise ValueError("Model has not been trained or loaded yet.")
            
            actual_features = [col for col in self.feature_columns if col in features.columns]
            
            if len(actual_features) == 0:
                raise ValueError("No valid features found for prediction!")
            
            predictions = []
            
            # Lấy dữ liệu cuối cùng làm base cho recursive forecasting
            last_row = features.iloc[-1:].copy()
            
            # Lấy history gần nhất cho rolling calculations
            recent_history = list(features['quantity_sold'].values[-30:]) if 'quantity_sold' in features.columns else [5] * 30
            
            for day in range(horizon):
                # Predict next day
                pred_value = self.model.predict(last_row[actual_features])[0]
                pred_value = max(0, round(float(pred_value)))
                predictions.append(pred_value)
                
                # Update features for next prediction (recursive)
                recent_history.append(pred_value)
                
                # Update lag features
                last_row = last_row.copy()
                if 'quantity_sold_lag_1' in last_row.columns:
                    last_row['quantity_sold_lag_1'] = pred_value
                if 'quantity_sold_lag_7' in last_row.columns and len(recent_history) >= 7:
                    last_row['quantity_sold_lag_7'] = recent_history[-7]
                if 'quantity_sold_lag_30' in last_row.columns and len(recent_history) >= 30:
                    last_row['quantity_sold_lag_30'] = recent_history[-30]
                
                # Update rolling features
                window_7 = recent_history[-7:] if len(recent_history) >= 7 else recent_history
                window_30 = recent_history[-30:] if len(recent_history) >= 30 else recent_history
                
                if 'rolling_mean_7' in last_row.columns:
                    last_row['rolling_mean_7'] = np.mean(window_7)
                if 'rolling_mean_30' in last_row.columns:
                    last_row['rolling_mean_30'] = np.mean(window_30)
                if 'rolling_std_7' in last_row.columns:
                    last_row['rolling_std_7'] = np.std(window_7) if len(window_7) > 1 else 0
                
                # Update time features for next day
                from datetime import timedelta
                if 'sale_date' in features.columns:
                    last_date = pd.to_datetime(features['sale_date'].iloc[-1]) + timedelta(days=day + 1)
                else:
                    from datetime import datetime
                    last_date = datetime.now() + timedelta(days=day + 1)
                
                if 'day_of_week' in last_row.columns:
                    last_row['day_of_week'] = last_date.weekday()
                if 'month' in last_row.columns:
                    last_row['month'] = last_date.month
                if 'quarter' in last_row.columns:
                    last_row['quarter'] = (last_date.month - 1) // 3 + 1
                if 'is_weekend' in last_row.columns:
                    last_row['is_weekend'] = 1 if last_date.weekday() >= 5 else 0
                if 'back_to_school' in last_row.columns:
                    last_row['back_to_school'] = 1 if last_date.month in [8, 9] else 0
                if 'year_end' in last_row.columns:
                    last_row['year_end'] = 1 if last_date.month == 12 else 0
                if 'black_friday' in last_row.columns:
                    last_row['black_friday'] = 1 if last_date.month == 11 else 0
                
            return predictions
        except Exception as e:
            logger.error(f"Error predicting: {str(e)}")
            raise e
    
    def predict_with_dates(self, features: pd.DataFrame, horizon: int = 30) -> list:
        """Dự báo và trả về kết quả với ngày tương ứng"""
        from datetime import timedelta
        
        predictions = self.predict(features, horizon)
        
        if 'sale_date' in features.columns:
            last_date = pd.to_datetime(features['sale_date'].iloc[-1])
        else:
            from datetime import datetime
            last_date = datetime.now()
        
        result = []
        for i, pred in enumerate(predictions):
            forecast_date = last_date + timedelta(days=i + 1)
            result.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predicted_demand': pred
            })
        
        return result
    
    def get_feature_importance(self) -> dict:
        """Trả về feature importance từ trained model"""
        if self.model is None:
            return {}
        
        importance = self.model.feature_importances_
        feature_names = self.model.feature_names_in_ if hasattr(self.model, 'feature_names_in_') else self.feature_columns[:len(importance)]
        
        result = {}
        for name, imp in zip(feature_names, importance):
            result[name] = round(float(imp), 4)
        
        # Sort by importance descending
        result = dict(sorted(result.items(), key=lambda x: x[1], reverse=True))
        return result
    
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
