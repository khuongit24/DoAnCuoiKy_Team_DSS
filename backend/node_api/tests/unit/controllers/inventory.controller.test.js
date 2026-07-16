const inventoryController = require('../../../src/controllers/inventory.controller');
const eoqRopService = require('../../../src/services/eoqRopService');
const db = require('../../../src/config/database');
const AppError = require('../../../src/utils/AppError');

jest.mock('../../../src/services/eoqRopService');
jest.mock('../../../src/config/database');

describe('Inventory Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { body: {}, query: {}, params: {} };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    it('calculateEOQ should return data on success', async () => {
        mockReq.body = { annualDemand: 100, orderingCost: 50, holdingCost: 2 };
        eoqRopService.calculateEOQ.mockReturnValue(70);
        await inventoryController.calculateEOQ(mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 70 });
    });

    it('calculateEOQ should call next with AppError on validation error', async () => {
        mockReq.body = {};
        await inventoryController.calculateEOQ(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('calculateROP should return data on success', async () => {
        mockReq.body = { dailyDemand: 10, leadTime: 5, safetyStock: 20 };
        eoqRopService.calculateROP.mockReturnValue(70);
        await inventoryController.calculateROP(mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 70 });
    });

    it('getRecommendations should return data on success', async () => {
        mockReq.query = { productId: 1 };
        db.query.mockResolvedValueOnce({ rows: [{ product_id: 1, product_name: 'test', stock_quantity: 10 }] }); // inventory
        db.query.mockResolvedValueOnce({ rows: [{ total_sold: 500 }] }); // sales
        db.query.mockResolvedValueOnce({ rows: [{ avg_lead_time: 5 }] }); // suppliers

        eoqRopService.getFullRecommendation.mockReturnValue({ recommendation: true });
        await inventoryController.getRecommendations(mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('getRecommendations should call next with AppError on missing productId', async () => {
        await inventoryController.getRecommendations(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('getAlerts should return data on success', async () => {
        db.query.mockResolvedValue({ rows: [{ product_id: 1, product_name: 'test', currentStock: 10, safetyStock: 15 }] });
        eoqRopService.getStockStatus.mockReturnValue('STOCKOUT_RISK');
        
        await inventoryController.getAlerts(mockReq, mockRes, mockNext);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1, product_name: 'test', currentStock: 10, rop: 35, safetyStock: 15, status: 'STOCKOUT_RISK' }] });
    });
});
