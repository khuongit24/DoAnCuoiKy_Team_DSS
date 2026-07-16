const errorHandler = require('../../../src/middlewares/errorHandler');
const logger = require('../../../src/utils/logger');

jest.mock('../../../src/utils/logger');

describe('Error Handler Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { method: 'GET', originalUrl: '/', body: {}, user: { user_id: 1 }, ip: '127.0.0.1' };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    it('should handle operational errors', () => {
        const err = new Error('Operational error');
        err.isOperational = true;
        err.statusCode = 404;
        err.code = 'NOT_FOUND';

        errorHandler(err, mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: expect.objectContaining({ code: 'NOT_FOUND', message: 'Operational error' })
        }));
    });

    it('should handle SyntaxError', () => {
        const err = new Error('Syntax error');
        err.name = 'SyntaxError';
        err.status = 400;
        err.body = {};

        errorHandler(err, mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.objectContaining({ code: 'VALIDATION_ERROR' })
        }));
    });

    it('should handle generic errors', () => {
        const err = new Error('Generic error');

        errorHandler(err, mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.objectContaining({ code: 'INTERNAL_ERROR' })
        }));
    });
});
