const WebSocket = require("ws");
const { logger } = require("./../dist/utils/LoggerUtils");
const db = require("./db");

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId to WebSocket client
    this.games = new Map(); // Map of gameId to Set of connected userIds
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws) => {
      logger.info("Client connected");

      ws.on("message", async (message) => {
        const data = JSON.parse(message);
        await this.handleMessage(ws, data);
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });
    });
  }

  async handleMessage(ws, data) {
    logger.info("Received message:", data);

    switch (data.type) {
      case "CONNECT":
        await this.handleConnect(ws, data.userId, data.gameId);
        break;
      case "CANCEL_SEARCH":
        await this.handleCancelSearch(data.userId);
        break;
      case "PING":
        ws.send(JSON.stringify({ type: "PONG" }));
        break;
      default:
        logger.info("Received unknown message type:", data.type);
    }
  }

  async handleConnect(ws, userId, gameId) {
    logger.info(`User ${userId} connected to game ${gameId}`);
    ws.userId = userId;
    ws.gameId = gameId;
    this.clients.set(userId, ws);

    if (gameId) {
      if (!this.games.has(gameId)) {
        this.games.set(gameId, new Set());
      }
      this.games.get(gameId).add(userId);
      await this.broadcastGameStatus(gameId);
    }

    this.broadcastOnlineUsers();
  }

  async handleDisconnect(ws) {
    logger.info(`Client disconnected: ${ws.userId}`);
    if (ws.userId) {
      this.clients.delete(ws.userId);
      if (ws.gameId && this.games.has(ws.gameId)) {
        this.games.get(ws.gameId).delete(ws.userId);
        await this.broadcastGameStatus(ws.gameId);
      }
    }
    this.broadcastOnlineUsers();
  }

  async handleCancelSearch(userId) {
    logger.info(`Cancelling game search for user ${userId}`);
    await db.cancelGameSearch(userId);
  }

  async broadcastGameStatus(gameId) {
    const connectedPlayers = Array.from(this.games.get(gameId) || []);
    const message = JSON.stringify({
      type: "GAME_STATUS_UPDATE",
      gameId,
      connectedPlayers,
    });

    for (const userId of connectedPlayers) {
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  broadcastOnlineUsers() {
    const count = this.clients.size;
    const message = JSON.stringify({ type: "ONLINE_USERS_COUNT", count });

    for (const client of this.clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  broadcastToGame(gameId, message) {
    const players = this.games.get(gameId) || new Set();
    for (const userId of players) {
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  }
}

const webSocketManager = new WebSocketManager();

module.exports = {
  initialize: (server) => webSocketManager.initialize(server),
  broadcastToGame: (gameId, message) => webSocketManager.broadcastToGame(gameId, message),
};
