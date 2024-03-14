// websocket.js

require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');

function connectToWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New WebSocket connection');

        ws.on('message', (message) => {
            console.log('Received message:', message);
            ws.send('Message received');
        });
    });
}

module.exports = { connectToWebSocketServer }; // Export the function correctly
