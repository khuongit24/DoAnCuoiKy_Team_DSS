const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecast.controller');

// GET /api/forecast/model-info
router.get('/model-info', forecastController.getModelInfo);

// GET /api/forecast/compare
router.get('/compare', forecastController.compareModels);

// POST /api/forecast/run
router.post('/run', forecastController.runForecastBatch);

// POST /api/forecast/:productId
// Needs to be POST or GET depending on the design, spec says POST /api/forecast? Actually API Spec says GET /api/forecast/:productId typically, but ML service allows POST for on-demand.
// Let's implement GET /api/forecast/:productId
router.get('/:productId', forecastController.getForecast);

// POST /api/forecast/train
router.post('/train', forecastController.trainModel);

// POST /api/forecast/etl
router.post('/etl', forecastController.triggerETL);

module.exports = router;
