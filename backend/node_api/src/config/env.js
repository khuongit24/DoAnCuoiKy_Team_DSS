const Joi = require('joi');
const dotenv = require('dotenv');

// Load .env file
dotenv.config();

// Định nghĩa schema validation
const envSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'staging', 'production')
        .default('development'),
    
    PORT: Joi.number().default(3000),
    
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'http', 'debug')
        .default('debug'),
    
    // Database
    DATABASE_URL: Joi.string().uri().required()
        .description('PostgreSQL connection string'),
    
    DB_POOL_MIN: Joi.number().integer().min(1).default(2),
    DB_POOL_MAX: Joi.number().integer().min(1).default(10),
    
    // JWT
    JWT_SECRET: Joi.string().min(32).required()
        .description('JWT signing secret (min 32 chars)'),
    
    JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
    
    // ML Service
    ML_SERVICE_URL: Joi.string().uri().required(),
    ML_INTERNAL_API_KEY: Joi.string().min(16).required(),
    ML_SERVICE_TIMEOUT: Joi.number().default(30000),
    
    // Gemini
    GEMINI_API_KEY: Joi.string().required(),
    GEMINI_MODEL: Joi.string().default('gemini-flash-latest'),
    GEMINI_MAX_TOKENS: Joi.number().default(1024),
    
    // CORS
    CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX: Joi.number().default(100)
    
}).unknown(); // Cho phép biến môi trường khác

// Validate
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    console.error('❌ Environment validation error:');
    console.error(error.details.map(d => `  - ${d.message}`).join('\n'));
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
}

// Export config object
module.exports = {
    nodeEnv: envVars.NODE_ENV,
    port: envVars.PORT,
    logLevel: envVars.LOG_LEVEL,
    
    db: {
        url: envVars.DATABASE_URL,
        poolMin: envVars.DB_POOL_MIN,
        poolMax: envVars.DB_POOL_MAX
    },
    
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpires: envVars.JWT_ACCESS_EXPIRES,
        refreshExpires: envVars.JWT_REFRESH_EXPIRES
    },
    
    mlService: {
        url: envVars.ML_SERVICE_URL,
        apiKey: envVars.ML_INTERNAL_API_KEY,
        timeout: envVars.ML_SERVICE_TIMEOUT
    },
    
    gemini: {
        apiKey: envVars.GEMINI_API_KEY,
        model: envVars.GEMINI_MODEL,
        maxTokens: envVars.GEMINI_MAX_TOKENS
    },
    
    cors: {
        origin: envVars.CORS_ORIGIN
    },
    
    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW_MS,
        max: envVars.RATE_LIMIT_MAX
    }
};
