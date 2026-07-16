const { Pool } = require('pg');
const config = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
    connectionString: config.db.url,
    min: config.db.poolMin,
    max: config.db.poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    ssl: config.nodeEnv === 'production' 
        ? { rejectUnauthorized: false } 
        : false
});

// Event listeners
pool.on('connect', () => {
    logger.debug('New PostgreSQL connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

// Helper function
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Query executed', { 
            text: text.substring(0, 100), 
            duration: `${duration}ms`, 
            rows: result.rowCount 
        });
        return result;
    } catch (error) {
        logger.error('Query failed', { 
            text: text.substring(0, 100), 
            error: error.message 
        });
        throw error;
    }
};

// Test connection on startup
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');
        logger.info(`✅ PostgreSQL connected: ${result.rows[0].now}`);
    } catch (error) {
        logger.error(`❌ PostgreSQL connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { pool, query, testConnection };
