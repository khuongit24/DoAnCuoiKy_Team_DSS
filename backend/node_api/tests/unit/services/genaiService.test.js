const genaiService = require('../../../src/services/genaiService');
const config = require('../../../src/config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');

jest.mock('@google/generative-ai');
jest.mock('../../../src/utils/logger', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
}));

describe('GenAIService', () => {
    let mockGenerateContent;
    let mockSendMessage;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockGenerateContent = jest.fn().mockResolvedValue({
            response: { text: () => 'Mock explanation' }
        });

        mockSendMessage = jest.fn().mockResolvedValue({
            response: { text: () => 'Mock chat response' }
        });

        const mockGetGenerativeModel = jest.fn().mockImplementation((options) => {
            return {
                generateContent: mockGenerateContent,
                startChat: jest.fn().mockReturnValue({
                    sendMessage: mockSendMessage
                })
            };
        });

        GoogleGenerativeAI.mockImplementation(() => {
            return {
                getGenerativeModel: mockGetGenerativeModel
            };
        });

        // Re-initialize service with mocked GoogleGenerativeAI
        const GenAIServiceClass = require('../../../src/services/genaiService').constructor;
        // The export is an instance, we need to hack it or test the instance methods directly
    });

    describe('explainRecommendation', () => {
        it('should return fallback explanation when API key is missing or dummy', async () => {
            const contextData = { product_name: 'CPU Intel Core i9' };
            const originalKey = config.gemini.apiKey;
            config.gemini.apiKey = 'DUMMY_KEY_FOR_TESTS';

            const result = await genaiService.explainRecommendation(contextData);

            expect(result.model_used).toBe('fallback-template');
            expect(result.explanation).toContain('CPU Intel Core i9');
            
            config.gemini.apiKey = originalKey;
        });

        it('should return API response when API key is valid', async () => {
            const contextData = { product_name: 'CPU Intel Core i9' };
            const originalKey = config.gemini.apiKey;
            config.gemini.apiKey = 'valid-key';

            // Need to mock the model directly since it's instantiated on load
            genaiService.explanationModel = {
                generateContent: mockGenerateContent
            };

            const result = await genaiService.explainRecommendation(contextData);

            expect(result.explanation).toBe('Mock explanation');
            expect(result.model_used).toBeDefined();

            config.gemini.apiKey = originalKey;
        });
        
        it('should handle API errors and return fallback', async () => {
            const contextData = { product_name: 'CPU Intel Core i9' };
            const originalKey = config.gemini.apiKey;
            config.gemini.apiKey = 'valid-key';

            genaiService.explanationModel = {
                generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
            };

            const result = await genaiService.explainRecommendation(contextData);

            expect(result.model_used).toBe('fallback-template');
            expect(result.explanation).toContain('CPU Intel Core i9');

            config.gemini.apiKey = originalKey;
        });
    });

    describe('chat', () => {
        it('should return API response when API key is valid', async () => {
            const originalKey = config.gemini.apiKey;
            config.gemini.apiKey = 'valid-key';

            genaiService.chatModel = {
                startChat: jest.fn().mockReturnValue({
                    sendMessage: mockSendMessage
                })
            };

            const result = await genaiService.chat('Hello', { total_products: 10 });

            expect(result).toBe('Mock chat response');

            config.gemini.apiKey = originalKey;
        });

        it('should handle API errors in chat', async () => {
            const originalKey = config.gemini.apiKey;
            config.gemini.apiKey = 'valid-key';

            genaiService.chatModel = {
                startChat: jest.fn().mockReturnValue({
                    sendMessage: jest.fn().mockRejectedValue(new Error('API Error'))
                })
            };

            const result = await genaiService.chat('Hello', { total_products: 10 });

            expect(result).toBe('Xin lỗi, tôi không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau.');

            config.gemini.apiKey = originalKey;
        });
    });

    describe('RateLimiter', () => {
        it('should throw error when limit exceeded', async () => {
            // override rate limiter
            genaiService.rateLimiter.limit = 2;
            genaiService.rateLimiter.requests = [];
            
            await genaiService.rateLimiter.checkLimit();
            await genaiService.rateLimiter.checkLimit();
            
            await expect(genaiService.rateLimiter.checkLimit()).rejects.toThrow('RATE_LIMIT_EXCEEDED');
            
            // reset
            genaiService.rateLimiter.limit = 60;
            genaiService.rateLimiter.requests = [];
        });
    });
});
