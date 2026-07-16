const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
// Auth removed

router.post('/calculate-eoq', inventoryController.calculateEOQ);
router.post('/calculate-rop', inventoryController.calculateROP);
router.get('/recommendations', inventoryController.getRecommendations);
router.get('/alerts', inventoryController.getAlerts);
router.patch('/:id/stock', inventoryController.updateStock);

module.exports = router;
