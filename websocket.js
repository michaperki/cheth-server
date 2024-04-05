const WebSocket = require('ws');
const { logger } = require('./utils/LoggerUtils');
const db = require('./db');

let onlineUsers = 0;
let clients = {}; // Object to store WebSocket clients and their associated user IDs

function websocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async ws => {
        logger.info('Client connected');
        onlineUsers++;
        broadcastOnlineUsers();

        ws.on('close', () => {
            logger.info('Client disconnected');
            onlineUsers--;
            removeClient(ws);
            broadcastOnlineUsers();
        });

        ws.on('message', async message => {
            const data = JSON.parse(message);
            console.log('Received message:', data);
            switch (data.type) {
                case 'CONNECT':
                    // Set the user ID for the client
                    logger.info('CONNECT message received');
                    // why is the data not available here?
                    // answer: the data is available here, but the logger is not printing it
                    // you can use console.log to print the data
                    console.log('Data:', data);
                    ws.userId = data.userId; // Store the user ID in the WebSocket client object
                    clients[data.userId] = ws;
                    // log the user IDs of all connected clients
                    console.log('Connected clients:', Object.keys(clients));
                    break;
                case 'CANCEL_SEARCH':
                    console.log('CANCEL_SEARCH message received');
                    // Implement logic to cancel the search
                    userId = data.userId;
                    db.cancelGameSearch(userId);

                    break;
                case 'PING':
                    logger.info('Received PING message');
                    ws.send(JSON.stringify({ type: 'PONG' }));
                    break;
                default:
                    logger.info('Received unknown message type:', data.type);
                    break;
            }
        });
    });

    function broadcastOnlineUsers() {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "ONLINE_USERS_COUNT", count: onlineUsers }));
            }
        });
    }

    function removeClient(ws) {
        // Remove the WebSocket client from the clients object
        const userId = Object.keys(clients).find(key => clients[key] === ws);
        delete clients[userId];
    }

    return { wss, clients }; // Return WebSocket Server instance and clients dictionary
}

module.exports = websocket;
