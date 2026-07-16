const authMiddleware = require('../../../src/middlewares/auth');
const jwt = require('jsonwebtoken');
const config = require('../../../src/config/env');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { headers: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    it('should return 401 if authorization header is missing', () => {
        authMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.objectContaining({ code: 'UNAUTHORIZED' })
        }));
    });

    it('should return 401 if token is invalid', () => {
        mockReq.headers.authorization = 'Bearer invalidtoken';
        jwt.verify.mockImplementation(() => { throw new Error(); });

        authMiddleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.objectContaining({ code: 'TOKEN_INVALID' })
        }));
    });

    it('should call next and set req.user if token is valid', () => {
        mockReq.headers.authorization = 'Bearer validtoken';
        const decodedToken = { user_id: 1, role: 'admin' };
        jwt.verify.mockReturnValue(decodedToken);

        authMiddleware(mockReq, mockRes, mockNext);
        expect(mockReq.user).toEqual(decodedToken);
        expect(mockNext).toHaveBeenCalled();
    });
});
