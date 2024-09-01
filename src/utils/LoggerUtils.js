const pino = require('pino');
const expressPino = require('pino-http');
const LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// Create a Pino logger instance
const logger = pino({
    level: LOG_LEVEL,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        }
    },
    redact: {
        paths: [
            'req.headers',
            'req.remoteAddress',
            'req.remotePort',
            'res.headers'
        ],
        remove: true,
    },
});

// Create a custom serializer for requests
const customReqSerializer = (req) => ({
    method: req.method,
    url: req.url,
});

// Create a custom serializer for responses
const customResSerializer = (res) => ({
    statusCode: res.statusCode
});

// Create an Express middleware with Pino logger
const expressLogger = expressPino({
    logger,
    serializers: {
        req: customReqSerializer,
        res: customResSerializer
    },
    // Only log if the response status code is 400 or higher
    customLogLevel: function (res, err) {
        if (res.statusCode >= 400 || err) {
            return 'error'
        }
        return 'silent'
    },
    // Customize the objects included in the log
    customSuccessMessage: function (res) {
        if (res.statusCode >= 400) {
            return `request errored with status code: ${res.statusCode}`
        }
        return `request completed`
    },
    customErrorMessage: function (error, res) {
        return `request errored with status code: ${res.statusCode}`
    },
});

module.exports = { logger, expressLogger };
