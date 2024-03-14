require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes');
const http = require('http');
const ws = require('ws');

const app = express();
const server = http.createServer(app); // Create HTTP server
const wss = new ws.Server({ server }); // Create WebSocket server

app.use(express.json());
app.use(cors());
app.use('/api', routes);

const PORT = process.env.PORT || 5000;

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('Received message:', message);
        ws.send('Message received');
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    
    // Print WebSocket URL
    const hostname = server.address().address;
    console.log(`WebSocket URL: ws://${hostname}:${PORT}`);
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
