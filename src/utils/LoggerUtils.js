
const pino = require('pino');
const expressPino = require('pino-http');

// Set the log level, defaulting to 'info' if not provided by environment variables
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Define the main logger instance using pino
const logger = pino({
    level: LOG_LEVEL,
    transport: {
        target: 'pino-pretty', // Pretty-print the logs for easier reading
        options: {
            colorize: true, // Enable colored output
            translateTime: 'SYS:standard', // Show system time in logs
            ignore: 'pid,hostname', // Omit 'pid' and 'hostname' from the logs
            messageFormat: '{msg}', // Format log messages
            levelFirst: true, // Show the log level before the message
        }
    },
});

// Define the express-specific logger middleware using pino-http
const expressLogger = expressPino({
    logger, // Use the previously defined logger instance

    // Auto-logging configuration, ignoring certain requests based on method and URL
    autoLogging: {
        ignore: (request) => request.method === 'OPTIONS' || request.url === '/crypto/ethToUsd'
    },

    // Custom logic for setting log levels based on the response status and errors
    customLogLevel: (request, response, error) => {
        if (response.statusCode >= 400 && response.statusCode < 500) {
            return 'warn'; // Log client errors as warnings
        } else if (response.statusCode >= 500 || error) {
            return 'error'; // Log server errors or general errors as errors
        }
        return 'info'; // Log all other successful requests as 'info'
    },

    // Customize the success log message format
    customSuccessMessage: (request, response) => {
        const method = formatMethod(request.method); // Format the HTTP method with colors
        const url = colorize(request.originalUrl || request.url, 36); // Use originalUrl if available
        const status = formatStatus(response.statusCode); // Format the status code with colors
        const time = colorize(`${response.responseTime || 0}ms`, 33); // Yellow-colored response time
        return `${method} ${url} ${status} ${time}`; // Return the formatted log message
    },

    // Customize the error log message format, adding request/response details and error stack
    customErrorMessage: (error, request, response) => {
        const method = formatMethod(request.method); // Format the HTTP method with colors
        const url = colorize(request.url, 36); // Cyan-colored URL
        const status = formatStatus(response.statusCode); // Format the status code with colors
        const queryParams = JSON.stringify(request.query); // Log query parameters
        const headers = JSON.stringify(request.headers); // Log request headers
        const requestBody = JSON.stringify(request.body) || 'No Body'; // Log request body
        const responseBody = JSON.stringify(response.body) || 'No Response Body'; // Log response body
        const stackTrace = error.stack ? `\nStack: ${error.stack}` : ''; // Log error stack if available
        return `${method} ${url} ${status} Error: ${error.message} \nQuery Params: ${queryParams} \nHeaders: ${headers} \nRequest Body: ${requestBody} \nResponse Body: ${responseBody} ${stackTrace}`; // Return the formatted log message with full context
    },

    // Define custom serializers for the request and response, disabling the default output
    serializers: {
        req: () => undefined, // Do not log the full request object
        res: () => undefined  // Do not log the full response object
    }
});

// Utility function to colorize a string using ANSI escape codes
function colorize(string, colorCode) {
    return `\x1b[${colorCode}m${string}\x1b[0m`;
}

// Function to format the HTTP method with colors based on method type
function formatMethod(method) {
    switch(method) {
        case 'GET': return colorize(method, 32); // Green for GET
        case 'POST': return colorize(method, 34); // Blue for POST
        case 'PUT': return colorize(method, 33); // Yellow for PUT
        case 'DELETE': return colorize(method, 31); // Red for DELETE
        default: return colorize(method, 37); // White for other methods
    }
}

// Function to format the HTTP status code with colors based on status range
function formatStatus(status) {
    if (status < 200) return colorize(status, 37); // White for informational responses
    if (status < 300) return colorize(status, 32); // Green for successful responses
    if (status < 400) return colorize(status, 36); // Cyan for redirection
    if (status < 500) return colorize(status, 33); // Yellow for client errors
    return colorize(status, 31); // Red for server errors
}

// Custom function to log user actions with colorized output
const logUserConnection = (userId, action) => {
    const userAction = colorize(`User ${userId} ${action}`, 35); // Magenta-colored user actions
    logger.info(userAction); // Log the user action with the info log level
};

// Export the logger, express logger, and custom user connection logger
module.exports = { logger, expressLogger, logUserConnection };

