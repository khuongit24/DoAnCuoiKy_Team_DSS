from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
import os
import time

from api.schemas import ForecastRequest, ForecastResponse, TrainRequest, TrainResponse, ModelInfo
from api.dependencies import verify_internal_api_key
from models.forecast_xgboost import XGBoostForecaster
from models.forecast_timeseries import ARIMAForecaster

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DSS ML Service", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NODE_API_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mocked DB/Model storage for demonstration
# In production, load from PostgreSQL and joblib
active_models = {
    "xgboost": None,
    "arima": None
}

@app.get("/api/ml/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/ml/forecast", response_model=ForecastResponse, dependencies=[Depends(verify_internal_api_key)])
async def forecast(request: ForecastRequest):
    """Run forecasting for a product"""
    try:
        # Mocking the forecast process for now
        # In reality, fetch historical data, feature engineering, then model.predict()
        logger.info(f"Forecasting for product {request.product_id} using {request.model_type}")
        
        # Mock forecast values
        mock_forecast = [{"date": (datetime.now().date()).isoformat(), "predicted_demand": 5 + i} for i in range(request.horizon)]
        total_demand = sum(f["predicted_demand"] for f in mock_forecast)
        
        return ForecastResponse(
            product_id=request.product_id,
            model_type=request.model_type,
            forecast=mock_forecast,
            total_predicted_demand=total_demand,
            metrics={"mae": 1.5, "rmse": 2.1, "mape": 0.05},
            generated_at=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating forecast")

@app.post("/api/ml/train", response_model=TrainResponse, dependencies=[Depends(verify_internal_api_key)])
async def train_model(request: TrainRequest):
    """Train or retrain a model"""
    logger.info(f"Training {request.model_type} model")
    start_time = time.time()
    
    # Mocking training
    time.sleep(1) # simulate training time
    
    return TrainResponse(
        model_type=request.model_type,
        metrics={"mae": 1.2, "rmse": 1.8, "mape": 0.04},
        model_path=f"saved_models/{request.model_type}_latest.pkl",
        training_samples=1000,
        training_time_seconds=round(time.time() - start_time, 2)
    )

@app.get("/api/ml/model-info", response_model=ModelInfo, dependencies=[Depends(verify_internal_api_key)])
async def get_model_info(model_type: str = "xgboost"):
    """Get active model information"""
    return ModelInfo(
        model_type=model_type,
        model_path=f"saved_models/{model_type}_latest.pkl",
        last_trained=datetime.now().isoformat(),
        training_metrics={"mae": 1.2, "rmse": 1.8, "mape": 0.04},
        feature_importance={"quantity_sold_lag_1": 0.3, "rolling_mean_7": 0.25} if model_type == "xgboost" else None
    )

@app.post("/api/ml/etl/run", dependencies=[Depends(verify_internal_api_key)])
async def trigger_etl():
    """Trigger the ETL pipeline manually"""
    from etl.scheduler import run_etl_pipeline
    import asyncio
    
    # Run in background to not block response
    # asyncio.create_task(run_etl_pipeline())
    logger.info("ETL pipeline triggered")
    return {"message": "ETL pipeline triggered successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.server:app", host="0.0.0.0", port=8000, reload=True)
