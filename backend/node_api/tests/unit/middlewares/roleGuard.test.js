const roleGuard = require('../../../src/middlewares/roleGuard');

describe('Role Guard Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { user: {} };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    it('should return 401 if user is not in request', () => {
        delete mockReq.user;
        const middleware = roleGuard(['admin']);
        middleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 if user role is not allowed', () => {
        mockReq.user.role = 'user';
        const middleware = roleGuard(['admin']);
        middleware(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should call next if user role is allowed', () => {
        mockReq.user.role = 'admin';
        const middleware = roleGuard(['admin', 'manager']);
        middleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });
});
