require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const http = require('http');
const websocket = require('./websocket'); // Import the websocket function
const { logger, expressLogger } = require('./utils/LoggerUtils'); // Import the logger instance and expressLogger middleware
const router = require('./routes');

const app = express();
const server = http.createServer(app);


app.use(express.json());
app.use(expressLogger); // Use Pino middleware for logging

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Initialize WebSocket and get the instance
const { wss, onlineUsers } = websocket.startWebSocketServer(server);

// Middleware to inject WebSocket instance into request object
app.use((req, res, next) => {
    req.wss = wss;
    req.onlineUsers = onlineUsers;
    next();
});

// Custom middleware for logging only necessary requests
app.use((req, res, next) => {
    if (req.originalUrl !== '/crypto/ethToUsd') {
        logger.info('Request completed', {
            req,
            res
        });
    }
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
