require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes');
const http = require('http');
const websocket = require('./websocket'); // Import the websocket function

const app = express();
const server = http.createServer(app);

app.use(express.json());

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

app.use('/api', routes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

db.connectToDatabase(
    () => {
        console.log('Connected to the database');
    },
    (error) => {
        console.error('Error connecting to the database:', error);
    }
);
