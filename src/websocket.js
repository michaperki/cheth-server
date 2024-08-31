const WebSocket = require("ws");
const { logger } = require("./../dist/utils/LoggerUtils");
const db = require("./db");

// Global set to store connected player IDs
const connectedPlayers = new Set();
let clients = {}; // Object to store WebSocket clients and their associated user IDs

function websocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws) => {
    logger.info("Client connected");

    ws.on("close", () => {
      logger.info("Client disconnected");
      if (ws.userId) {
        connectedPlayers.delete(ws.userId);
        delete clients[ws.userId];
        broadcastPlayerStatus(wss);
      }
      broadcastOnlineUsers(wss);
    });

    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      console.log("Received message:", data);
      switch (data.type) {
        case "CONNECT":
          logger.info("CONNECT message received");
          console.log("Data:", data);
          ws.userId = data.userId;
          clients[data.userId] = ws;
          connectedPlayers.add(data.userId);
          console.log("Connected clients:", Object.keys(clients));
          sendConnectedPlayers(ws);
          broadcastPlayerStatus(wss);
          break;
        case "CANCEL_SEARCH":
          console.log("CANCEL_SEARCH message received");
          await db.cancelGameSearch(data.userId);
          break;
        case "PING":
          logger.info("Received PING message");
          ws.send(JSON.stringify({ type: "PONG" }));
          break;
        default:
          logger.info("Received unknown message type:", data.type);
          break;
      }
    });

    broadcastOnlineUsers(wss);
  });

  return { wss, clients };
}

function broadcastOnlineUsers(wss) {
  const count = wss.clients.size;
  broadcastToAll(wss, JSON.stringify({ type: "ONLINE_USERS_COUNT", count }));
}

function broadcastPlayerStatus(wss) {
  broadcastToAll(wss, JSON.stringify({
    type: "PLAYER_STATUS_UPDATE",
    players: Array.from(connectedPlayers)
  }));
}

function sendConnectedPlayers(ws) {
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
