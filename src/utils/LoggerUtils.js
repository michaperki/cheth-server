const pino = require('pino');
const expressPino = require('pino-http');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

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
});

const expressLogger = expressPino({
    logger,
    autoLogging: false,
    customSuccessMessage: function (req, res) {
        if (res.statusCode >= 400) {
            return `${req.method} ${req.url} ${res.statusCode}`;
        }
        return null;  // Don't log successful requests
    },
    customErrorMessage: function (error, req, res) {
        return `${req.method} ${req.url} ${res.statusCode} - Error: ${error.message}`;
    },
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
        }),
        res: (res) => ({
            statusCode: res.statusCode
        }),
        err: pino.stdSerializers.err,
    }
});

module.exports = { logger, expressLogger };
