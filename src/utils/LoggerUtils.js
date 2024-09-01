const pino = require('pino');
const expressPino = require('pino-http');
const LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// Create a Pino logger instance
const logger = pino({
    level: LOG_LEVEL,
    transport: {
        target: 'pino-pretty'
    },
    
    redact: {
        paths: [
            'req.headers', 
            'req.connection.remoteAddress',
            'req.connection.remotePort',
            'req.connection.remoteAddress',
            'res.headers',
            ], // Redact sensitive information
        remove: true, // Remove the redacted fields completely from the log
    },
});

// Create an Express middleware with Pino logger
const expressLogger = expressPino({ logger });

module.exports = { logger, expressLogger };
