const authController = require('../../../src/controllers/auth.controller');
const UserModel = require('../../../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { body: {} };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should return 400 if validation fails', async () => {
            await authController.register(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 409 if email exists', async () => {
            mockReq.body = { username: 'test', password: 'Password123!', email: 'test@example.com', full_name: 'test', role: 'admin' };
            UserModel.findByEmail.mockResolvedValue({ user_id: 1 });
            await authController.register(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ message: 'Email đã tồn tại' }) }));
        });

        it('should return 201 on success', async () => {
            mockReq.body = { username: 'test', password: 'Password123!', email: 'test@example.com', full_name: 'test', role: 'admin' };
            UserModel.findByEmail.mockResolvedValue(null);
            UserModel.findByUsername.mockResolvedValue(null);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hash');
            UserModel.create.mockResolvedValue({ user_id: 1 });
            await authController.register(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(201);
        });
    });

    describe('login', () => {
        it('should return 400 if validation fails', async () => {
            await authController.login(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should return 401 if user not found', async () => {
            mockReq.body = { email: 'test@example.com', password: 'password123' };
            UserModel.findByEmail.mockResolvedValue(null);
            await authController.login(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should return 200 on success', async () => {
            mockReq.body = { email: 'test@example.com', password: 'password123' };
            UserModel.findByEmail.mockResolvedValue({ user_id: 1, is_active: true, password_hash: 'hash' });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');
            UserModel.updateRefreshToken.mockResolvedValue(true);
            
            await authController.login(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
