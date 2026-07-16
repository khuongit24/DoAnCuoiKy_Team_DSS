const genaiController = require('../../../src/controllers/genai.controller');
const genaiService = require('../../../src/services/genaiService');
const { GenAIConversationModel, ProductModel } = require('../../../src/models/data.models');
const db = require('../../../src/config/database');

jest.mock('../../../src/services/genaiService');
jest.mock('../../../src/models/data.models', () => ({
    GenAIConversationModel: {
        create: jest.fn(),
        findRecentHistory: jest.fn()
    },
    ProductModel: {
        findAll: jest.fn()
    }
}));
jest.mock('../../../src/config/database');

describe('GenAI Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { body: {}, user: { user_id: 1 } };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('explain should return 400 if missing data', async () => {
        await genaiController.explain(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('explain should return data on success', async () => {
        mockReq.body = { type: 'test', product_id: 1, context: {} };
        genaiService.explainRecommendation.mockResolvedValue({ explanation: 'test', model_used: 'model' });
        await genaiController.explain(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('chat should return 400 if missing message', async () => {
        await genaiController.chat(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('chat should return data on success', async () => {
        mockReq.body = { message: 'hello' };
        ProductModel.findAll.mockResolvedValue({ total: 10 });
        db.query.mockResolvedValue({ rows: [{ count: 5 }] });
        GenAIConversationModel.create.mockResolvedValue(true);
        GenAIConversationModel.findRecentHistory.mockResolvedValue([]);
        genaiService.chat.mockResolvedValue('response');

        await genaiController.chat(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('getHistory should return data on success', async () => {
        GenAIConversationModel.findRecentHistory.mockResolvedValue([{ message_role: 'user', message_content: 'hi' }]);
        await genaiController.getHistory(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
