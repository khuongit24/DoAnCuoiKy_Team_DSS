import numpy as np

class ModelEvaluator:
    @staticmethod
    def calculate_mae(y_true, y_pred):
        """Mean Absolute Error"""
        return np.mean(np.abs(np.array(y_true) - np.array(y_pred)))
    
    @staticmethod
    def calculate_rmse(y_true, y_pred):
        """Root Mean Squared Error"""
        return np.sqrt(np.mean((np.array(y_true) - np.array(y_pred)) ** 2))
    
    @staticmethod
    def calculate_mape(y_true, y_pred):
        """Mean Absolute Percentage Error"""
        y_true, y_pred = np.array(y_true), np.array(y_pred)
        mask = y_true != 0
        if not np.any(mask):
            return 0.0
        return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask]))
    
    @staticmethod
    def evaluate(y_true, y_pred):
        """Đánh giá đầy đủ"""
        return {
            'mae': round(float(ModelEvaluator.calculate_mae(y_true, y_pred)), 4),
            'rmse': round(float(ModelEvaluator.calculate_rmse(y_true, y_pred)), 4),
            'mape': round(float(ModelEvaluator.calculate_mape(y_true, y_pred)), 4)
        }
