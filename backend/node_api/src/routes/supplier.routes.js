const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');

router.post('/configure-weights', supplierController.configureWeights);
router.get('/ranking', supplierController.getRanking);
router.post('/evaluate', supplierController.evaluateSupplier);
router.get('/ranking/:productId', supplierController.getRankingByProduct);

module.exports = router;
