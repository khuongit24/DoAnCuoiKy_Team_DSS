const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom token cho user_id
morgan.token('user-id', (req) => req.user?.user_id || 'anonymous');

// Stream Morgan logs qua Winston
const stream = {
    write: (message) => logger.http(message.trim())
};

const requestLogger = morgan(
    ':remote-addr :user-id :method :url :status :res[content-length] - :response-time ms',
    { stream }
);

module.exports = requestLogger;
