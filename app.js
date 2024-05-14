require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { expressLogger, logger } = require('./utils/LoggerUtils');
const router = require('./routes');
const websocket = require('./websocket'); // Import the websocket function

const app = express();

app.use(express.json());
app.use(expressLogger); // Use Pino middleware for logging

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Add a basic root route handler
app.get('/', (req, res) => {
    res.send('Server is running');
});

// The icons route should serve all the icons in the icons folder
app.use('/icons', express.static(path.join(__dirname, 'icons')));

app.use('/allIcons', (req, res) => {
    const iconsDir = path.join(__dirname, 'icons');

    fs.readdir(iconsDir, (err, files) => {
        if (err) {
            console.error('Error reading icons directory:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const iconFiles = files.filter(file => /\.(svg)$/i.test(file));
        res.json({ icons: iconFiles });
    });
});

app.use(router);

// Middleware to inject WebSocket instance into request object
app.use((req, res, next) => {
    req.wss = app.wss;
    req.clients = app.clients;
    next();
});

// Custom middleware for logging only necessary requests
app.use((req, res, next) => {
    if (req.originalUrl !== '/crypto/ethToUsd') {
        logger.info('Request completed', { req, res });
    }
    next();
});

module.exports = app;

