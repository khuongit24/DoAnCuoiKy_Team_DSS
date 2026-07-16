const { pool } = require('../src/config/database');

beforeAll(() => {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret';
});

afterAll(async () => {
  // Close database connection after all tests
  if (pool) {
    await pool.end();
  }
});
