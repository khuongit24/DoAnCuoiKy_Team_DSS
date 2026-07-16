const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const logger = require('../utils/logger');

// Basic rate limiter instance specific to GenAI service to avoid overwhelming the API
class GenAIRateLimiter {
    constructor(limitPerMinute = 60) {
        this.requests = [];
        this.limit = limitPerMinute;
    }

    async checkLimit() {
        const now = Date.now();
        // Remove requests older than 1 minute
        this.requests = this.requests.filter(timestamp => now - timestamp < 60000);

        if (this.requests.length >= this.limit) {
            throw new Error('RATE_LIMIT_EXCEEDED');
        }

        this.requests.push(now);
    }
}

class RuleBasedAI {
    static chat(message, context) {
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes('chào')) {
            return `Xin chào! Hiện tại hệ thống AI trực tuyến (Gemini) đang bảo trì hoặc quá tải. Tuy nhiên, tôi (AI Dự Phòng) vẫn có thể cung cấp cho bạn thông tin cơ bản. Bạn cần hỏi gì?`;
        }
        if (lowerMsg.includes('tồn kho') || lowerMsg.includes('kho hàng')) {
            return `Dựa trên dữ liệu hiện tại, hệ thống có tổng cộng ${context.total_products || 0} sản phẩm. Trong đó có ${context.low_stock_products || 0} sản phẩm đang ở mức tồn kho thấp cần chú ý.`;
        }
        if (lowerMsg.includes('doanh thu') || lowerMsg.includes('tài chính') || lowerMsg.includes('lợi nhuận')) {
            return `Về mặt tài chính, hệ thống ghi nhận các giao dịch liên tục. Để xem báo cáo chi tiết về tổng doanh thu và lợi nhuận, bạn vui lòng truy cập Dashboard Tài chính hoặc Giám đốc Kinh doanh.`;
        }
        return `Xin lỗi, do hệ thống AI chính (Gemini) đang bị lỗi mạng hoặc quá tải (503 Service Unavailable), tôi là AI Dự Phòng chỉ có thể trả lời các từ khóa cơ bản như "tồn kho", "doanh thu", "chào". Vui lòng thử lại sau!`;
    }
}

class GenAIService {
    constructor() {
        if (!config.gemini.apiKey) {
            logger.warn('GEMINI_API_KEY is not set. GenAI Service will not work properly.');
        }

        this.genAI = new GoogleGenerativeAI(config.gemini.apiKey || 'DUMMY_KEY_FOR_TESTS');
        this.rateLimiter = new GenAIRateLimiter(60);
        const modelName = config.gemini.model || 'gemini-flash-latest';

        this.explanationModel = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: config.gemini.maxTokens || 1024,
                topP: 0.8,
                topK: 40
            }
        });

        this.chatModel = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                topP: 0.9,
                topK: 50
            }
        });
    }

    async _withRetry(apiCallFn, maxRetries = 3) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await apiCallFn();
            } catch (error) {
                lastError = error;
                // Retry on 503 (Service Unavailable) or 429 (Too Many Requests)
                if (error.status === 503 || error.status === 429 || (error.message && (error.message.includes('503') || error.message.includes('429')))) {
                    logger.warn(`Gemini API overloaded (Attempt ${i + 1}/${maxRetries}). Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
    }

    _buildExplanationPrompt(contextData) {
        const supplierName = contextData.top_supplier ? contextData.top_supplier.supplier_name : 'Chưa xác định';
        const topsisScore = contextData.top_supplier ? contextData.top_supplier.topsis_score : 'N/A';
        const supplierPrice = contextData.top_supplier ? contextData.top_supplier.price : 'N/A';
        const leadTime = contextData.top_supplier ? contextData.top_supplier.lead_time : 'N/A';
        const defectRate = contextData.top_supplier ? (contextData.top_supplier.defect_rate * 100) : 'N/A';
        const reliability = contextData.top_supplier ? contextData.top_supplier.reliability_score : 'N/A';

        return `Bạn là trợ lý AI chuyên gia trong lĩnh vực quản lý chuỗi cung ứng và mua sắm linh kiện điện tử.
Dựa trên dữ liệu phân tích sau, hãy giải thích tại sao hệ thống đề xuất nhập hàng cho sản phẩm này. Trình bày ngắn gọn, rõ ràng, dễ hiểu cho nhà quản lý kinh doanh.

=== DỮ LIỆU PHÂN TÍCH ===
Sản phẩm: ${contextData.product_name} (${contextData.category})
Thương hiệu: ${contextData.brand}
Vòng đời: ${contextData.lifecycle_stage}

Tồn kho hiện tại: ${contextData.current_stock} đơn vị
Tồn kho an toàn (Safety Stock): ${contextData.safety_stock} đơn vị
Điểm đặt hàng lại (ROP): ${contextData.rop} đơn vị
Trạng thái: ${contextData.stock_status || 'Cần đặt hàng'}

Dự báo nhu cầu 30 ngày tới: ${contextData.forecast_demand} đơn vị

Lượng đặt hàng tối ưu (EOQ): ${contextData.eoq} đơn vị
Chi phí đặt hàng: ${contextData.ordering_cost} VND/lần
Chi phí lưu kho: ${contextData.holding_cost_per_unit} VND/đơn vị/năm

Nhà cung cấp đề xuất: ${supplierName}
Điểm TOPSIS: ${topsisScore}
Giá: ${supplierPrice} VND
Lead Time: ${leadTime} ngày
Tỷ lệ lỗi: ${defectRate}%
Điểm uy tín: ${reliability}/100

=== YÊU CẦU ===
Giải thích lý do đề xuất nhập hàng, bao gồm:
1. Tại sao cần nhập lúc này (phân tích tồn kho + nhu cầu)
2. Tại sao nhập số lượng này (phân tích EOQ)
3. Tại sao chọn nhà cung cấp này (phân tích TOPSIS)
4. Ước tính tổng chi phí và thời gian nhận hàng`;
    }

    _generateFallbackExplanation(contextData) {
        const supplierName = contextData.top_supplier ? contextData.top_supplier.supplier_name : 'Chưa xác định';
        return `**Đề xuất nhập hàng cho ${contextData.product_name}:**\n\n` +
            `- Tồn kho hiện tại: ${contextData.current_stock} đơn vị (ROP: ${contextData.rop})\n` +
            `- Nhu cầu dự báo 30 ngày: ${contextData.forecast_demand} đơn vị\n` +
            `- Lượng nhập tối ưu: ${contextData.eoq} đơn vị\n` +
            `- Nhà cung cấp đề xuất: ${supplierName}\n\n` +
            `*Lưu ý: Giải thích chi tiết từ AI tạm thời không khả dụng do lỗi kết nối. Hệ thống vẫn đưa ra các thông số tính toán chính xác để tham khảo.*`;
    }

    async explainRecommendation(contextData, modelType = 'genai') {
        try {
            if (modelType === 'rule_based') {
                return {
                    explanation: this._generateFallbackExplanation(contextData),
                    model_used: 'rule-based-algorithm'
                };
            }
            await this.rateLimiter.checkLimit();
            const prompt = this._buildExplanationPrompt(contextData);

            // Nếu không có API Key, trả về fallback luôn để không báo lỗi ứng dụng
            if (!config.gemini.apiKey || config.gemini.apiKey === 'DUMMY_KEY_FOR_TESTS') {
                logger.warn('Missing Gemini API Key, using fallback explanation.');
                return {
                    explanation: this._generateFallbackExplanation(contextData),
                    model_used: 'fallback-template'
                };
            }

            const result = await this._withRetry(() => this.explanationModel.generateContent(prompt));
            return {
                explanation: result.response.text(),
                model_used: config.gemini.model || 'gemini-flash-latest'
            };
        } catch (error) {
            logger.error('Gemini API Error in explainRecommendation:', error);
            return {
                explanation: this._generateFallbackExplanation(contextData),
                model_used: 'fallback-template',
                error: error.message === 'RATE_LIMIT_EXCEEDED' ? 'Hệ thống đang quá tải yêu cầu, vui lòng thử lại sau.' : undefined
            };
        }
    }

    _buildFinancePrompt(contextData) {
        return `Bạn là Giám đốc Tài chính (CFO) AI chuyên gia phân tích dữ liệu tài chính doanh nghiệp.
Dựa trên dữ liệu tài chính hiện tại, hãy giải thích, đánh giá sức khỏe tài chính và đưa ra ý kiến hỗ trợ ra quyết định. Trình bày ngắn gọn, rõ ràng.

=== DỮ LIỆU TÀI CHÍNH ===
Tổng doanh thu: ${contextData.totalRevenue.toLocaleString()} VND
Tổng chi phí: ${contextData.totalCosts.toLocaleString()} VND
Lợi nhuận ước tính: ${contextData.estimatedProfit.toLocaleString()} VND
Tỷ suất lợi nhuận: ${(contextData.profitMargin * 100).toFixed(2)}%

=== YÊU CẦU ===
1. Đánh giá sơ bộ về lợi nhuận và tỷ suất lợi nhuận (có đạt mức an toàn/tốt không?).
2. Nhận xét về tương quan chi phí so với doanh thu.
3. Đưa ra 2-3 đề xuất hoặc cảnh báo để cải thiện hiệu quả tài chính hoặc cắt giảm chi phí.`;
    }

    _generateFinanceFallbackExplanation(contextData) {
        return `**Đánh giá Tài chính:**\n\n` +
            `- Tổng doanh thu: ${contextData.totalRevenue.toLocaleString()} VND\n` +
            `- Lợi nhuận: ${contextData.estimatedProfit.toLocaleString()} VND (Tỷ suất: ${(contextData.profitMargin * 100).toFixed(2)}%)\n\n` +
            `*Lưu ý: Đánh giá chi tiết từ AI tạm thời không khả dụng do lỗi kết nối.*`;
    }

    async explainFinance(contextData, modelType = 'genai') {
        try {
            if (modelType === 'rule_based') {
                return {
                    explanation: this._generateFinanceFallbackExplanation(contextData),
                    model_used: 'rule-based-algorithm'
                };
            }
            await this.rateLimiter.checkLimit();
            const prompt = this._buildFinancePrompt(contextData);

            if (!config.gemini.apiKey || config.gemini.apiKey === 'DUMMY_KEY_FOR_TESTS') {
                return {
                    explanation: this._generateFinanceFallbackExplanation(contextData),
                    model_used: 'fallback-template'
                };
            }

            const result = await this._withRetry(() => this.explanationModel.generateContent(prompt));
            return {
                explanation: result.response.text(),
                model_used: config.gemini.model || 'gemini-flash-latest'
            };
        } catch (error) {
            logger.error('Gemini API Error in explainFinance:', error);
            return {
                explanation: this._generateFinanceFallbackExplanation(contextData),
                model_used: 'fallback-template',
                error: error.message === 'RATE_LIMIT_EXCEEDED' ? 'Hệ thống đang quá tải yêu cầu, vui lòng thử lại sau.' : undefined
            };
        }
    }

    _buildDashboardPrompt(contextData) {
        return `Bạn là Giám đốc Điều hành (CEO) và Chuyên gia Phân tích Dữ liệu AI của một doanh nghiệp bán lẻ thiết bị điện tử.
Dựa trên các chỉ số tổng quan của hệ thống, hãy đưa ra một đánh giá ngắn gọn (khoảng 3-4 câu) về tình hình kinh doanh, tài chính và kho hàng hiện tại.
Đồng thời, đề xuất 2-3 hành động ưu tiên nhất cần thực hiện.

=== DỮ LIỆU TỔNG QUAN ===
- Tổng số sản phẩm: ${contextData.overview.totalProducts}
- Tổng doanh thu (Overview): ${contextData.overview.totalRevenue.toLocaleString()} VND
- Tổng số lượng tồn kho: ${contextData.overview.currentInventory} đơn vị

- Doanh thu (Sales): ${contextData.sales.totalRevenue.toLocaleString()} VND
- Sản phẩm bán chạy nhất: ${contextData.sales.topProduct}

- Lợi nhuận (Finance): ${contextData.financial.profit.toLocaleString()} VND
- Chi phí (Finance): ${contextData.financial.costs.toLocaleString()} VND

=== CẢNH BÁO TỪ HỆ THỐNG ===
${contextData.alerts.length > 0 ? contextData.alerts.map(a => '- ' + a.message).join('\n') : '- Không có cảnh báo nghiêm trọng nào.'}

=== YÊU CẦU ===
1. Một đoạn nhận xét chung ngắn gọn về hiệu suất (Doanh thu so với chi phí, tình trạng tồn kho, cảnh báo).
2. Bullet points cho 2-3 đề xuất hành động khẩn cấp/ưu tiên. Định dạng dễ đọc (bold các từ khóa chính).`;
    }

    _generateDashboardFallback(contextData) {
        return `**Nhận xét Tổng quan:**\n\n` +
            `Hệ thống hiện đang quản lý ${contextData.overview.totalProducts} sản phẩm với tổng doanh thu đạt ${contextData.overview.totalRevenue.toLocaleString()} VND. Lợi nhuận tạm tính là ${contextData.financial.profit.toLocaleString()} VND. Sản phẩm bán chạy nhất là ${contextData.sales.topProduct}.\n\n` +
            `**Đề xuất Hành động:**\n` +
            `- Theo dõi sát sao các cảnh báo tồn kho và chu kỳ sống của sản phẩm.\n` +
            `- Tối ưu hóa chi phí đặt hàng và lưu kho để cải thiện biên lợi nhuận.\n\n` +
            `*Lưu ý: Nhận xét AI sinh động tạm thời không khả dụng do hệ thống đang quá tải hoặc lỗi kết nối.*`;
    }

    async explainDashboard(contextData, modelType = 'genai') {
        try {
            if (modelType === 'rule_based') {
                return {
                    explanation: this._generateDashboardFallback(contextData),
                    model_used: 'rule-based-algorithm'
                };
            }
            await this.rateLimiter.checkLimit();
            const prompt = this._buildDashboardPrompt(contextData);

            if (!config.gemini.apiKey || config.gemini.apiKey === 'DUMMY_KEY_FOR_TESTS') {
                return {
                    explanation: this._generateDashboardFallback(contextData),
                    model_used: 'fallback-template'
                };
            }

            const result = await this._withRetry(() => this.explanationModel.generateContent(prompt));
            return {
                explanation: result.response.text(),
                model_used: config.gemini.model || 'gemini-flash-latest'
            };
        } catch (error) {
            logger.error('Gemini API Error in explainDashboard:', error);
            return {
                explanation: this._generateDashboardFallback(contextData),
                model_used: 'fallback-template',
                error: error.message === 'RATE_LIMIT_EXCEEDED' ? 'Hệ thống đang quá tải yêu cầu, vui lòng thử lại sau.' : undefined
            };
        }
    }

    _buildChatSystemPrompt(systemContext) {
        return `Bạn là trợ lý AI chuyên gia trong lĩnh vực quản lý chuỗi cung ứng và mua sắm linh kiện điện tử (CPU, GPU, RAM, Motherboard, Storage). Bạn hỗ trợ doanh nghiệp phân phối phần cứng tại Việt Nam.

Vai trò của bạn:
1. Trả lời câu hỏi về chiến lược mua sắm, tồn kho, xu hướng thị trường
2. Đề xuất hành động cụ thể dựa trên dữ liệu hệ thống
3. Mô phỏng kịch bản kinh doanh

Quy tắc:
- Trả lời bằng tiếng Việt
- Format câu trả lời có cấu trúc (đánh số, gạch đầu dòng, in đậm)
- Đơn vị tiền tệ: VND, format: x,xxx,xxx

=== CONTEXT HỆ THỐNG HIỆN TẠI ===
Tổng sản phẩm: ${systemContext.total_products}
Sản phẩm cảnh báo tồn kho thấp: ${systemContext.low_stock_products}
`;
    }

    async chat(userMessage, systemContext, conversationHistory = []) {
        try {
            await this.rateLimiter.checkLimit();

            if (!config.gemini.apiKey || config.gemini.apiKey === 'DUMMY_KEY_FOR_TESTS') {
                return 'Xin lỗi, trợ lý AI chưa được cấu hình API Key nên tạm thời không hoạt động.';
            }

            // Xây dựng history theo định dạng của Gemini API (role: user/model)
            const formattedHistory = conversationHistory.map(msg => ({
                role: msg.message_role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.message_content }]
            }));

            // Thêm system prompt vào history (hoặc như một phần của cuộc trò chuyện)
            const systemPrompt = this._buildChatSystemPrompt(systemContext);

            // Gemini 1.5 hỗ trợ systemInstruction trong config, 
            // nhưng để tương thích với cách dùng history cũ, ta khởi tạo chat session.
            const chat = this.chatModel.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: systemPrompt + '\n\nĐây là hệ thống context, bạn hãy xác nhận đã hiểu và chúng ta bắt đầu hỗ trợ người dùng.' }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Tôi đã hiểu và sẵn sàng hỗ trợ.' }]
                    },
                    ...formattedHistory
                ]
            });

            const result = await this._withRetry(() => chat.sendMessage(userMessage));
            return result.response.text();

        } catch (error) {
            logger.error('Gemini API Error in chat:', error);
            // Kích hoạt Hệ thống AI thay thế (Rule-based) khi Gemini API fail hoàn toàn
            return RuleBasedAI.chat(userMessage, systemContext);
        }
    }
}

module.exports = new GenAIService();
