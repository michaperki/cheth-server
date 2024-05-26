const pino = require('pino');
const expressPino = require('pino-http');

// Create a Pino logger instance
const logger = pino({
    level: 'info', // Set log level to 'info' (default is 'info')
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


