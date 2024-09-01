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
            messageFormat: '{msg} {req.method} {req.url} {res.statusCode} {responseTime}ms'
        }
    },
});

const expressLogger = expressPino({
    logger,
    autoLogging: {
        ignore: (req) => req.url === '/crypto/ethToUsd' // Ignore ethToUsd requests
    },
    customSuccessMessage: (req, res) => {
        if (res.statusCode >= 400) {
            return 'request errored';
        }
        return false; // Don't log successful requests
    },
    customErrorMessage: (error, req, res) => {
        return 'request errored';
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
