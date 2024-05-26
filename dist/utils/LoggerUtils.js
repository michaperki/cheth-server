"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
// Create a Pino logger instance
const logger = (0, pino_1.default)({
    level: "info", // Set log level to 'info' (default is 'info')
    transport: {
        target: "pino-pretty",
    },
    redact: {
        paths: [
            "req.headers",
            "req.connection.remoteAddress",
            "req.connection.remotePort",
            "res.headers",
        ], // Redact sensitive information
        remove: true, // Remove the redacted fields completely from the log
    },
});
exports.logger = logger;
// Create an Express middleware with Pino logger
const expressLogger = (0, pino_http_1.default)({ logger });
exports.expressLogger = expressLogger;
