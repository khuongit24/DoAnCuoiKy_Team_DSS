from pydantic import BaseModel
from typing import Optional, List

class ForecastRequest(BaseModel):
    product_id: int
    horizon: int = 30
    model_type: str = "xgboost"

class ForecastResponse(BaseModel):
    product_id: int
    model_type: str
    forecast: List[dict]
    total_predicted_demand: int
    metrics: dict
    generated_at: str
    historical: Optional[List[dict]] = None

class TrainRequest(BaseModel):
    model_type: str = "xgboost"
    training_period_days: int = 365

class TrainResponse(BaseModel):
    model_type: str
    metrics: dict
    model_path: str
    training_samples: int
    training_time_seconds: float

class ModelInfo(BaseModel):
    model_type: str
    model_path: str
    last_trained: Optional[str]
    training_metrics: Optional[dict]
    feature_importance: Optional[dict]
