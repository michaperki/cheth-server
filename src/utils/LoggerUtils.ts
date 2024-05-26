import pino, { Logger } from "pino";
import expressPino from "pino-http";
import { HttpLogger } from "pino-http";

// Create a Pino logger instance
const logger: Logger = pino({
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

// Create an Express middleware with Pino logger
const expressLogger: HttpLogger = expressPino({ logger });

export { logger, expressLogger };
