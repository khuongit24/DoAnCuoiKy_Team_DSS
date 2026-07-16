const genaiService = require('../services/genaiService');
const { GenAIConversationModel, ProductModel, InventoryModel } = require('../models/data.models');
const logger = require('../utils/logger');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

async function _getSystemContext() {
    const totalProducts = await ProductModel.findAll({ limit: 1 }).then(res => res.total);
    const lowStockResult = await db.query(`SELECT COUNT(*) FROM inventory WHERE stock_quantity <= safety_stock`);
    return {
        total_products: totalProducts,
        low_stock_products: parseInt(lowStockResult.rows[0].count, 10) 
    };
}

class GenAIController {
    
    explain = asyncHandler(async (req, res, next) => {
        const { type, product_id, context, model_type } = req.body;
        
        if (!type || !context || (type !== 'dashboard' && type !== 'finance' && !product_id)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Thiếu các trường bắt buộc: type, context, và product_id (đối với type khác dashboard/finance)'
                }
            });
        }

        // Gọi service GenAI sinh giải thích
        let result;
        if (type === 'finance') {
            result = await genaiService.explainFinance(context, model_type);
        } else if (type === 'dashboard') {
            result = await genaiService.explainDashboard(context, model_type);
        } else {
            result = await genaiService.explainRecommendation(context, model_type);
        }

        res.status(200).json({
            success: true,
            data: {
                explanation: result.explanation,
                generated_at: new Date().toISOString(),
                model_used: result.model_used
            }
        });
    });

    chat = asyncHandler(async (req, res, next) => {
        const { message, conversation_id } = req.body;
        const user_id = req.user.user_id; // Giả sử user_id được gắn bởi auth middleware
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Nội dung tin nhắn (message) không được để trống'
                }
            });
        }

        try {
            // Lưu tin nhắn của user vào database
            await GenAIConversationModel.create({
                user_id,
                message_role: 'user',
                message_content: message
            }).catch(err => logger.warn('Không thể lưu tin nhắn user vào DB', err));

            // Lấy context và history
            const systemContext = await _getSystemContext().catch(() => ({ total_products: 0, low_stock_products: 0 }));
            const history = await GenAIConversationModel.findRecentHistory(user_id, 10).catch(() => []);

            // Gọi AI
            const responseText = await genaiService.chat(message, systemContext, history);

            // Lưu phản hồi của AI
            await GenAIConversationModel.create({
                user_id,
                message_role: 'assistant',
                message_content: responseText
            }).catch(err => logger.warn('Không thể lưu tin nhắn AI vào DB', err));

            res.status(200).json({
                success: true,
                data: {
                    conversation_id: conversation_id || Date.now(),
                    response: responseText,
                    reply: responseText,
                    sources_used: ["system_context", "conversation_history"],
                    generated_at: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Error in chat controller:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Lỗi server khi xử lý chat AI'
                }
            });
        }
    });

    getHistory = asyncHandler(async (req, res, next) => {
        const user_id = req.user.user_id;
        
        // Lấy toàn bộ history của user
        const messages = await GenAIConversationModel.findRecentHistory(user_id, 50);

        res.status(200).json({
            success: true,
            data: [
                {
                    conversation_id: 1, // Gom chung theo mockup spec
                    messages: messages.map(m => ({
                        role: m.message_role,
                        content: m.message_content
                    })),
                    created_at: new Date().toISOString()
                }
            ]
        });
    });
}

module.exports = new GenAIController();
