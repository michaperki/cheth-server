const WebSocket = require("ws");
const { logger } = require("./../dist/utils/LoggerUtils");
const db = require("./db");

const connectedPlayers = new Set();
let clients = {};

function websocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws) => {
    logger.info("New WebSocket connection established");

    ws.on("close", () => {
      logger.info("WebSocket connection closed");
      if (ws.userId) {
        connectedPlayers.delete(ws.userId);
        delete clients[ws.userId];
        broadcastPlayerStatus(wss);
        logger.info({ userId: ws.userId }, "User disconnected");
      }
      broadcastOnlineUsers(wss);
    });

    ws.on("message", async (message) => {
      let data;
      try {
        data = JSON.parse(message);
        logger.debug({ messageType: data.type }, "Received WebSocket message");

        switch (data.type) {
          case "CONNECT":
            handleConnect(ws, data, wss);
            break;
          case "CANCEL_SEARCH":
            await handleCancelSearch(data);
            break;
          case "PING":
            handlePing(ws);
            break;
          default:
            logger.warn({ messageType: data.type }, "Received unknown message type");
        }
      } catch (error) {
        logger.error({ err: error, message }, "Error processing WebSocket message");
      }
    });

    broadcastOnlineUsers(wss);
  });

  return { wss, clients };
}

function handleConnect(ws, data, wss) {
  logger.info({ userId: data.userId }, "User connected");
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
