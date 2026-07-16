import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forecastService } from './forecastService';
import api from './api';

vi.mock('./api');

describe('forecastService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getForecast should call api.get', async () => {
    api.get.mockResolvedValueOnce({ data: {} });
    await forecastService.getForecast(1, 30, 'xgboost');
    expect(api.get).toHaveBeenCalledWith('/forecast/1', { params: { horizon: 30, model_type: 'xgboost' } });
  });

  it('runForecast should call api.post', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    await forecastService.runForecast([1, 2], 15, 'arima');
    expect(api.post).toHaveBeenCalledWith('/forecast/run', { product_ids: [1, 2], horizon: 15, model_type: 'arima' });
  });

  it('trainModel should call api.post', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    await forecastService.trainModel('xgboost', 90);
    expect(api.post).toHaveBeenCalledWith('/forecast/train', { model_type: 'xgboost', training_period_days: 90 });
  });

  it('compareModels should call api.get', async () => {
    api.get.mockResolvedValueOnce({ data: {} });
    await forecastService.compareModels(1);
    expect(api.get).toHaveBeenCalledWith('/forecast/compare', { params: { productId: 1 } });
  });

  it('getModelInfo should call api.get', async () => {
    api.get.mockResolvedValueOnce({ data: {} });
    await forecastService.getModelInfo('arima');
    expect(api.get).toHaveBeenCalledWith('/forecast/model-info', { params: { model_type: 'arima' } });
  });

  it('triggerETL should call api.post', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    await forecastService.triggerETL();
    expect(api.post).toHaveBeenCalledWith('/forecast/etl');
  });
});
