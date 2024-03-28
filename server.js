require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const http = require('http');
const websocket = require('./websocket'); // Import the websocket function
const pino = require('pino'); // Import Pino
const expressPino = require('pino-http'); // Import Pino-HTTP for Express

const app = express();
const server = http.createServer(app);
const router = require('./routes');

// Create a Pino logger instance
const logger = pino({
    level: 'info' // Set log level to 'info' (default is 'info')
});

// Create an Express middleware with Pino logger
const expressLogger = expressPino({ logger });

app.use(express.json());
app.use(expressLogger); // Use Pino middleware for logging

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Initialize WebSocket and get the instance
const wss = websocket(server);

// Middleware to inject WebSocket instance into request object
app.use((req, res, next) => {
    req.wss = wss;
    next();
});

app.use(router);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
});

db.connectToDatabase(
    () => {
        logger.info('Connected to the database');
    },
    (error) => {
        logger.error('Error connecting to the database:', error);
    }
);

module.exports = app;
