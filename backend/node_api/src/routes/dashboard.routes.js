const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
// Auth removed

router.get('/overview', dashboardController.getOverviewStats);
router.get('/alerts', dashboardController.getAlerts);
router.get('/financial', dashboardController.getFinancialStats);
router.get('/sales', dashboardController.getSalesStats);
router.get('/sales/trend', dashboardController.getSalesTrend);
router.get('/budget-report', dashboardController.getBudgetReport);

module.exports = router;
