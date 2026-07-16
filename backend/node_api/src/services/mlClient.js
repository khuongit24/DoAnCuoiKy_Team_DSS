const axios = require('axios');
const logger = require('../utils/logger'); // Assuming logger exists or gracefully fallback

class MLClient {
    constructor() {
        this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8000/api/ml';
        this.timeout = parseInt(process.env.ML_SERVICE_TIMEOUT) || 30000;
        this.apiKey = process.env.ML_INTERNAL_API_KEY || 'dev_internal_key';
        this.maxRetries = 1;
    }

    async forecast(productId, horizon = 30, model = 'xgboost') {
        return this._request('POST', '/forecast', {
            product_id: productId,
            horizon,
            model_type: model
        });
    }

    async trainModel(modelType = 'xgboost', periodDays = 365) {
        return this._request('POST', '/train', {
            model_type: modelType,
            training_period_days: periodDays
        });
    }

    async runForecastBatch(productIds, horizon = 30, model = 'xgboost') {
        return this._request('POST', '/forecast/batch', {
            product_ids: productIds,
            horizon,
            model_type: model
        });
    }

    async compareModels(productId) {
        return this._request('GET', `/forecast/compare?product_id=${productId}`);
    }

    async getModelInfo(modelType = 'xgboost') {
        return this._request('GET', `/model-info?model_type=${modelType}`);
    }

    async triggerETL() {
        return this._request('POST', '/etl/run');
    }

    async healthCheck() {
        return this._request('GET', '/health');
    }

    async _request(method, path, data = null) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await axios({
                    method,
                    url: `${this.baseURL}${path}`,
                    data,
                    timeout: this.timeout,
                    headers: { 'x-api-key': this.apiKey }
                });
                return response.data;
            } catch (error) {
                lastError = error;
                if (logger && logger.warn) {
                    logger.warn(`ML Service request failed (Attempt ${attempt}/${this.maxRetries}): ${error.message}`);
                } else {
                    console.warn(`ML Service request failed (Attempt ${attempt}/${this.maxRetries}): ${error.message}`);
                }
                
                if (attempt < this.maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s
                    await this._sleep(Math.pow(2, attempt - 1) * 1000);
                }
            }
        }
        
        const errorMessage = `ML Service error after ${this.maxRetries} attempts: ${lastError.response?.data?.detail || lastError.message}`;
        if (logger && logger.error) {
            logger.error(errorMessage);
        } else {
            console.error(errorMessage);
        }
        throw new Error(errorMessage);
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new MLClient();
