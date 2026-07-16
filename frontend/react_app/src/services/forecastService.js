import api from './api';

export const forecastService = {
  getForecast: (productId, horizon = 30, model_type = 'xgboost') => 
    api.get(`/forecast/${productId}`, { params: { horizon, model_type } }),
  
  runForecast: (productIds, horizon = 30, model_type = 'xgboost') => 
    api.post('/forecast/run', { product_ids: productIds, horizon, model_type }),
  
  trainModel: (model_type, training_period_days) => 
    api.post('/forecast/train', { model_type, training_period_days }),
  
  compareModels: (productId) => 
    api.get('/forecast/compare', { params: { productId } }),

  getModelInfo: (model_type = 'xgboost') =>
    api.get('/forecast/model-info', { params: { model_type } }),

  triggerETL: () =>
    api.post('/forecast/etl')
};
