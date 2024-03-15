const WebSocket = require('ws');
const db = require('./db'); // Import your database module

module.exports = function websocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async ws => {
        console.log('Client connected');

        ws.on('message', async message => {
            const data = JSON.parse(message);
            switch (data.type) {
                case "GET_GAMES":
                    console.log("Get games request received");
                    break;
                case "CREATE_GAME":
                    console.log("New game created with ID");
                    break;
                case "JOIN_GAME":
                    console.log("Join game request received");
                    // Broadcast a message to all connected clients when a game is joined
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: "GAME_JOINED", gameData: data.gameData }));
                        }
                    });
                    break;
                default:
                    console.log("Unknown message type received");
            }
        });
    });

    // Function to send game update message to all connected clients
    const sendGameUpdate = async (gameId) => {
        try {
            const game = await db.getGameById(gameId);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "GAME_UPDATE", game: game }));
                }
            });
        } catch (error) {
            console.error('Error sending game update:', error);
        }
    };

    return { wss, sendGameUpdate };
};
