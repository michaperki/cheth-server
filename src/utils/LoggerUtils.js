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
            messageFormat: '{msg}',
            levelFirst: true,
        }
    },
});

const expressLogger = expressPino({
    logger,
    autoLogging: {
        ignore: (req) => req.method === 'OPTIONS' || req.url === '/crypto/ethToUsd'
    },
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
        } else if (res.statusCode >= 500 || err) {
            return 'error';
        }
        return 'info';
    },
    customSuccessMessage: (req, res) => {
        const method = colorMethod(req.method);
        const url = colorize(req.url, 36); // Cyan
        const status = colorStatus(res.statusCode);
        const time = colorize(`${res.responseTime || 0}ms`, 33); // Yellow
        return `${method} ${url} ${status} ${time}`;
    },
    customErrorMessage: (error, req, res) => {
        const method = colorMethod(req.method);
        const url = colorize(req.url, 36); // Cyan
        const status = colorStatus(res.statusCode);
        return `${method} ${url} ${status} Error: ${error.message}`;
    },
    serializers: {
        req: () => undefined,
        res: () => undefined
    }
});

function colorize(str, colorCode) {
    return `\x1b[${colorCode}m${str}\x1b[0m`;
}

function colorMethod(method) {
    switch(method) {
        case 'GET': return colorize(method, 32); // Green
        case 'POST': return colorize(method, 34); // Blue
        case 'PUT': return colorize(method, 33); // Yellow
        case 'DELETE': return colorize(method, 31); // Red
        default: return colorize(method, 37); // White
    }
}

function colorStatus(status) {
    if (status < 200) return colorize(status, 37); // White
    if (status < 300) return colorize(status, 32); // Green
    if (status < 400) return colorize(status, 36); // Cyan
    if (status < 500) return colorize(status, 33); // Yellow
    return colorize(status, 31); // Red
}

// Custom logger for user connections
const logUserConnection = (userId, action) => {
    const userAction = colorize(`User ${userId} ${action}`, 35); // Magenta
    logger.info(userAction);
};

module.exports = { logger, expressLogger, logUserConnection };
