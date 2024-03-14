require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');

function connectToWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            console.log('Received message:', message);
            ws.send('Message received');
        });
    });
}

const server = http.createServer();

connectToWebSocketServer(server);

// Use the PORT environment variable provided by Heroku
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
