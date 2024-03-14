const WebSocket = require('ws');

module.exports = function websocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', async ws => {

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
                    break;
                
                default:
                    console.log("Unknown message type received");
            }
        });
    });

    return wss;
}


