const WebSocket = require("ws");
const { logger } = require("./../dist/utils/LoggerUtils");
const db = require("./db");
const redis = require("./utils/cache");

let onlineUsers = 0;
let clients = {}; // Object to store WebSocket clients and their associated user IDs

function websocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws) => {
    logger.info("Client connected");
    onlineUsers++;
    broadcastOnlineUsers();

    ws.on("close", () => {
      logger.info("Client disconnected");
      onlineUsers--;
      if (ws.userId) {
        // Broadcast that this player has disconnected
        broadcastToAll(JSON.stringify({
          type: "PLAYER_DISCONNECTED",
          userId: ws.userId
        }));
        delete clients[ws.userId];
      }
      removeClient(ws);
      broadcastOnlineUsers();
    });

    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      console.log("Received message:", data);
      switch (data.type) {
        case "CONNECT":
          logger.info("CONNECT message received");
          console.log("Data:", data);
          ws.userId = data.userId; // Store the user ID in the WebSocket client object
          clients[data.userId] = ws;
          console.log("Connected clients:", Object.keys(clients));
          // Broadcast that this player has connected
          broadcastToAll(JSON.stringify({
            type: "PLAYER_CONNECTED",
            userId: data.userId
          }));
          break;
        case "GAME_STATE_UPDATE":
          await handleGameStateUpdate(data.gameId, data.state);
          break;
        case "CANCEL_SEARCH":
          console.log("CANCEL_SEARCH message received");
          // Implement logic to cancel the search
          userId = data.userId;
          db.cancelGameSearch(userId);

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
  });

  function broadcastOnlineUsers() {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({ type: "ONLINE_USERS_COUNT", count: onlineUsers }),
        );
      }
    });
  }
  
  function broadcastToAll(message) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async function handleGameStateUpdate(gameId, newState) {
      await db.updateGameState(gameId, newState);
      await db.invalidateGameCache(gameId);
      
      const message = JSON.stringify({ type: "GAME_STATE_UPDATE", gameId, state: newState });
      broadcastToGamePlayers(gameId, message);
  }

  function broadcastToGamePlayers(gameId, message) {
      wss.clients.forEach((client) => {
          if (client.gameId === gameId && client.readyState === WebSocket.OPEN) {
              client.send(message);
          }
      });
  }

  function removeClient(ws) {
    // Remove the WebSocket client from the clients object
    const userId = Object.keys(clients).find((key) => clients[key] === ws);
    delete clients[userId];
  }

  return { wss, clients }; // Return WebSocket Server instance and clients dictionary
}

module.exports = websocket;
