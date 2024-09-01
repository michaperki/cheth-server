const WebSocket = require("ws");
const { logger } = require("./../dist/utils/LoggerUtils");
const db = require("./db");

const connectedPlayers = new Set();
let clients = {};

function websocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", async (ws) => {
        logger.debug("New WebSocket connection");

        ws.on("close", () => {
            if (ws.userId) {
                logger.info({ event: "user_connection", userId: ws.userId, status: "disconnected" }, "User connection status changed");
                connectedPlayers.delete(ws.userId);
                delete clients[ws.userId];
                broadcastPlayerStatus(wss);
            }
            broadcastOnlineUsers(wss);
        });

        ws.on("message", async (message) => {
            try {
                const data = JSON.parse(message);
                logger.debug({ messageType: data.type }, "Received WebSocket message");

                switch (data.type) {
                    case "CONNECT":
                        handleConnect(ws, data, wss);
                        break;
                    // ... other cases ...
                }
            } catch (error) {
                logger.error({ err: error }, "Error processing WebSocket message");
            }
        });

        broadcastOnlineUsers(wss);
    });

    return { wss, clients };
}

function handleConnect(ws, data, wss) {
    logger.info({ event: "user_connection", userId: data.userId, status: "connected" }, "User connection status changed");
    ws.userId = data.userId;
    clients[data.userId] = ws;
    connectedPlayers.add(data.userId);
    logger.debug({ connectedClients: Object.keys(clients) }, "Connected clients");
    sendConnectedPlayers(ws);
    broadcastPlayerStatus(wss);
}

async function handleCancelSearch(data) {
  logger.info({ userId: data.userId }, "Cancelling game search");
  await db.cancelGameSearch(data.userId);
}

function handlePing(ws) {
  logger.debug("Received PING, sending PONG");
  ws.send(JSON.stringify({ type: "PONG" }));
}

function broadcastOnlineUsers(wss) {
  const count = wss.clients.size;
  logger.debug({ onlineUsers: count }, "Broadcasting online user count");
  broadcastToAll(wss, JSON.stringify({ type: "ONLINE_USERS_COUNT", count }));
}

function broadcastPlayerStatus(wss) {
  logger.debug({ connectedPlayers: Array.from(connectedPlayers) }, "Broadcasting player status");
  broadcastToAll(wss, JSON.stringify({
    type: "PLAYER_STATUS_UPDATE",
    players: Array.from(connectedPlayers)
  }));
}

function sendConnectedPlayers(ws) {
  logger.debug({ connectedPlayers: Array.from(connectedPlayers) }, "Sending connected players to client");
  ws.send(JSON.stringify({
    type: "CONNECTED_PLAYERS",
    players: Array.from(connectedPlayers)
  }));
}

function broadcastToAll(wss, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = websocket;
