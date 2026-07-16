const dashboardController = require('../../../src/controllers/dashboard.controller');
const { query } = require('../../../src/config/database');

jest.mock('../../../src/config/database');

describe('Dashboard Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('getOverviewStats', () => {
        it('should return stats on success', async () => {
            query.mockResolvedValueOnce({ rows: [{ count: '10' }] })
                 .mockResolvedValueOnce({ rows: [{ sum: '1000' }] })
                 .mockResolvedValueOnce({ rows: [{ sum: '50' }] });
                 
            await dashboardController.getOverviewStats(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { totalProducts: 10, totalRevenue: 1000, currentInventory: 50 } }));
        });

        it('should handle db error', async () => {
            query.mockRejectedValue(new Error('DB Error'));
            await dashboardController.getOverviewStats(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getAlerts', () => {
        it('should return alerts on success', async () => {
            query.mockResolvedValue({ rows: [] });
            await dashboardController.getAlerts(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
