const express = require('express');
const router = express.Router();
const genaiController = require('../controllers/genai.controller');

// POST /api/genai/explain - Giải thích đề xuất
router.post('/explain', genaiController.explain);

// POST /api/genai/chat - Hỏi đáp nghiệp vụ
router.post('/chat', genaiController.chat);

// GET /api/genai/history - Lịch sử hội thoại
router.get('/history', genaiController.getHistory);

module.exports = router;
