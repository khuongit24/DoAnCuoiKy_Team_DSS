const supplierController = require('../../../src/controllers/supplier.controller');
const supplierRankingService = require('../../../src/services/supplierRankingService');
const db = require('../../../src/config/database');
const AppError = require('../../../src/utils/AppError');

jest.mock('../../../src/services/supplierRankingService');
jest.mock('../../../src/config/database');

describe('Supplier Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { body: {}, params: {}, query: {} };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('configureWeights should call next with AppError if matrix missing', async () => {
        await supplierController.configureWeights(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('configureWeights should return data on success', async () => {
        mockReq.body.pairwiseMatrix = [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]];
        supplierRankingService.calculateAHPWeights.mockReturnValue({ is_consistent: true, weights: [0.25,0.25,0.25,0.25] });
        db.query.mockResolvedValue({ rows: [] });
        await supplierController.configureWeights(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('getRanking should call next with AppError if no productId', async () => {
        await supplierController.getRanking(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('getRanking should return data on success', async () => {
        mockReq.query.productId = 1;
        db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'A', price: 10, defect_rate: 0.1, lead_time: 1, reliability_score: 90 }] }); // suppliers
        db.query.mockResolvedValueOnce({ rows: [] }); // latest weights
        db.query.mockResolvedValueOnce({ rows: [{ price_weight: 0.25, quality_weight: 0.25, delivery_weight: 0.25, reliability_weight: 0.25 }] }); // default weights
        
        supplierRankingService.runTOPSIS.mockReturnValue([{ rank: 1 }]);
        await supplierController.getRanking(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: [{ rank: 1 }] });
    });

    it('evaluateSupplier should return data on success', async () => {
        mockReq.body = { suppliers: [{ id: 1 }], weights: { price: 0.25, quality: 0.25, delivery: 0.25, reliability: 0.25 }, criteriaTypes: [] };
        supplierRankingService.runTOPSIS.mockReturnValue([{ rank: 1 }]);
        await supplierController.evaluateSupplier(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: [{ rank: 1 }] });
    });

    it('getRankingByProduct should return data on success', async () => {
        mockReq.params.productId = 1;
        db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        db.query.mockResolvedValueOnce({ rows: [] });
        db.query.mockResolvedValueOnce({ rows: [{ price_weight: 0.25, quality_weight: 0.25, delivery_weight: 0.25, reliability_weight: 0.25 }] });
        
        supplierRankingService.runTOPSIS.mockReturnValue([{ rank: 1 }]);
        await supplierController.getRankingByProduct(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, productId: 1 }));
    });
});
