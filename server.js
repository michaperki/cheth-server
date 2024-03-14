require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes');
const http = require('http');

const app = express();
const server = http.createServer(app); // Create HTTP server

// Connect to the WebSocket server
require('./websocket').connectToWebSocketServer(server);

app.use(express.json());
app.use(cors());
app.use('/api', routes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

});

// Connect to the database
db.connectToDatabase(
    () => {
        console.log('Connected to the database');
    },
    (error) => {
        console.error('Error connecting to the database:', error);
    }
);
