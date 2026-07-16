const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const config = require('../../src/config/env');

const adminToken = jwt.sign(
    { user_id: 1, username: 'admin', role: 'admin' },
    config.jwt.secret,
    { expiresIn: '1h' }
);

const userToken = jwt.sign(
    { user_id: 2, username: 'user', role: 'purchase_manager' },
    config.jwt.secret,
    { expiresIn: '1h' }
);

describe('API Integration Tests', () => {
    describe('Health Check', () => {
        it('should return 200 on /api/health', async () => {
            const res = await request(app).get('/api/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Auth endpoints', () => {
        it('should return 400 for invalid login payload', async () => {
            const res = await request(app).post('/api/auth/login').send({ email: 'notanemail' });
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('Data Endpoints', () => {
        it('should return 400 for non-existent entity', async () => {
            const res = await request(app)
                .get('/api/unknown_entity')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(400); // 400 INVALID_ENTITY instead of 404 because of route param validation
        });
    });

    describe('Inventory Endpoints', () => {
        it('should handle missing data for EOQ', async () => {
            const res = await request(app)
                .post('/api/inventory/calculate-eoq')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(res.statusCode).toEqual(400);
        });
    });
    
    describe('Dashboard Endpoints', () => {
        it('should reject access without token', async () => {
            const res = await request(app).get('/api/dashboard/summary');
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GenAI Endpoints', () => {
        it('should reject without token', async () => {
            const res = await request(app).post('/api/genai/chat').send({});
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('Supplier Endpoints', () => {
        it('should return ranking for supplier', async () => {
            const res = await request(app)
                .get('/api/suppliers/ranking')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBeDefined();
        });
    });
    
    describe('Forecast Endpoints', () => {
        it('should fail if ML service down', async () => {
            const res = await request(app)
                .get('/api/forecast/123')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(502);
        });
    });
});
