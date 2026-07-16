const dataController = require('../../../src/controllers/data.controller');
const { ProductModel } = require('../../../src/models/data.models');
const AppError = require('../../../src/utils/AppError');

jest.mock('../../../src/models/data.models', () => ({
    ProductModel: {
        findAll: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    }
}));

describe('Data Controller', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { params: { entity: 'products' }, query: {}, body: {} };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('should call next with AppError if entity not found', async () => {
            mockReq.params.entity = 'unknown';
            await dataController.getAll(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });

        it('should return data on success', async () => {
            ProductModel.findAll.mockResolvedValue({ data: [], total: 0 });
            await dataController.getAll(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, meta: expect.any(Object) }));
        });

        it('should call next on error', async () => {
            ProductModel.findAll.mockRejectedValue(new Error('DB Error'));
            await dataController.getAll(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('getById', () => {
        it('should return data on success', async () => {
            mockReq.params.id = 1;
            ProductModel.findById.mockResolvedValue({ id: 1 });
            await dataController.getById(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: 1 } }));
        });

        it('should call next with AppError if not found', async () => {
            mockReq.params.id = 1;
            ProductModel.findById.mockResolvedValue(null);
            await dataController.getById(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
        });
    });

    describe('create', () => {
        it('should call next with AppError on validation fail', async () => {
            ProductModel.create.mockResolvedValue({ id: 1 });
            await dataController.create(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(AppError)); // because body is {} and products require fields
        });

        it('should create data on success', async () => {
            mockReq.body = { product_name: 'test', category: 'CPU', brand: 'Intel' };
            ProductModel.create.mockResolvedValue({ id: 1 });
            await dataController.create(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('update', () => {
        it('should update data on success', async () => {
            mockReq.params.id = 1;
            mockReq.body = { product_name: 'test', category: 'CPU', brand: 'Intel' };
            ProductModel.update.mockResolvedValue({ id: 1 });
            await dataController.update(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });

    describe('remove', () => {
        it('should remove data on success', async () => {
            mockReq.params.id = 1;
            ProductModel.delete.mockResolvedValue(true);
            await dataController.remove(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
    });
});
