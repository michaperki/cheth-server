const WebSocket = require('ws');
const { logger } = require('./utils/LoggerUtils'); // Import the logger instance and expressLogger middleware

let onlineUsers = new Map(); // Initialize a Map to keep track of online users and their corresponding WebSocket connections

module.exports = {
    onlineUsers,
    startWebSocketServer: function(server) {
        const wss = new WebSocket.Server({ server });

        wss.on('connection', async ws => {
            logger.info('Client connected');
            
            ws.on('message', async message => {
                const data = JSON.parse(message);
                switch (data.type) {
                    case 'CONNECT': // When receiving user ID from client
                        onlineUsers.set(data.userId, ws); // Associate user ID with WebSocket connection
                        logger.info(`User ${data.userId} connected`);
                        broadcastOnlineUsers();
                        break;
                    // Handle other message types if needed
                    case 'PING':
                        logger.info('Received PING message');
                        ws.send(JSON.stringify({ type: 'PONG' }));
                        break;
                    default:
                        logger.info('Received unknown message type:', data.type);
                        break;
                }
            });

            ws.on('close', () => {
                logger.info('Client disconnected');
                // Remove user from the Map when WebSocket connection is closed
                onlineUsers.forEach((value, key) => {
                    if (value === ws) {
                        onlineUsers.delete(key);
                        logger.info(`User ${key} disconnected`);
                    }
                });
            });
        });

        function broadcastOnlineUsers() {
            // Broadcast the online user count to all connected clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "ONLINE_USERS_COUNT", count: onlineUsers.size }));
                }
            });
        }

        return wss;
    }
};
