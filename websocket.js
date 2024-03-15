const WebSocket = require('ws');

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

    // Define the function to send game updates to clients
    function sendGameUpdate(gameId) {
        const message = JSON.stringify({ type: 'game_update', gameId: gameId });
        // Iterate through WebSocket clients and send the message to each player
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    return { wss, sendGameUpdate };
};
