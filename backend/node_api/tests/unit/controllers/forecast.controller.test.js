const forecastController = require('../../../src/controllers/forecast.controller');
const mlClient = require('../../../src/services/mlClient');
const AppError = require('../../../src/utils/AppError');

jest.mock('../../../src/services/mlClient');

describe('Forecast Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { params: {}, query: {}, body: {} };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('getForecast', () => {
        it('should return forecast on success', async () => {
            mockReq.params.productId = 1;
            mlClient.forecast.mockResolvedValue({ data: 1 });
            await forecastController.getForecast(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should handle error', async () => {
            mlClient.forecast.mockRejectedValue(new Error('timeout'));
            await forecastController.getForecast(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('trainModel', () => {
        it('should return data on success', async () => {
            mlClient.trainModel.mockResolvedValue({});
            await forecastController.trainModel(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });

        it('should handle error', async () => {
            mlClient.trainModel.mockRejectedValue(new Error('error'));
            await forecastController.trainModel(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('getModelInfo', () => {
        it('should return data on success', async () => {
            mlClient.getModelInfo.mockResolvedValue({});
            await forecastController.getModelInfo(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('triggerETL', () => {
        it('should return data on success', async () => {
            mlClient.triggerETL.mockResolvedValue({});
            await forecastController.triggerETL(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});
