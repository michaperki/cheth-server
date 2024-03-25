const WebSocket = require('ws');

let onlineUsers = 0; // Initialize the online user count

module.exports = function websocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async ws => {
        console.log('Client connected');
        onlineUsers++; // Increment the online user count when a client connects
        broadcastOnlineUsers(); // Broadcast the updated online user count to all clients

        ws.on('close', () => {
            console.log('Client disconnected');
            onlineUsers--; // Decrement the online user count when a client disconnects
            broadcastOnlineUsers(); // Broadcast the updated online user count to all clients
        });

        ws.on('message', async message => {
            const data = JSON.parse(message);
            switch (data.type) {
                // Handle other message types if needed
                case 'PING':
                    console.log('Received ping from client');
                    ws.send(JSON.stringify({ type: 'PONG' }));
                    break;
                default:
                    console.log("Unknown message type received");
            }
        });
    });

    function broadcastOnlineUsers() {
        // Broadcast the online user count to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "ONLINE_USERS_COUNT", count: onlineUsers }));
            }
        });
    }

    return wss;
};
