require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const { logger, expressLogger } = require("./../dist/utils/LoggerUtils");
const router = require("./routes");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: [process.env.CORS_ORIGIN, 'http://localhost:3000'], // Add your frontend URL and localhost for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(expressLogger);

// Handle preflight requests
app.options('*', cors(corsOptions));

// Additional headers for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// WebSocket setup
const wss = new WebSocket.Server({ server });
let clients = {};

wss.on("connection", (ws) => {
  logger.info("Client connected");
  
  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case "CONNECT":
        ws.userId = data.userId;
        clients[data.userId] = ws;
        break;
      case "CANCEL_SEARCH":
        await db.cancelGameSearch(data.userId);
        break;
      case "PING":
        ws.send(JSON.stringify({ type: "PONG" }));
        break;
      default:
        logger.info("Received unknown message type:", data.type);
        break;
    }
  });

  ws.on("close", () => {
    logger.info("Client disconnected");
    removeClient(ws);
  });
});

function removeClient(ws) {
  const userId = Object.keys(clients).find((key) => clients[key] === ws);
  delete clients[userId];
}

// Middleware to inject WebSocket instance into request object
app.use((req, res, next) => {
  req.wss = wss;
  req.clients = clients;
  next();
});

// Custom middleware for logging
app.use((req, res, next) => {
  if (req.originalUrl !== "/crypto/ethToUsd") {
    logger.info("Request completed", { req, res });
  }
  next();
});

// Serve static files (icons)
app.use("/icons", express.static(path.join(__dirname, "icons")));

// Route to get all icons
app.use("/allIcons", (req, res) => {
  const iconsDir = path.join(__dirname, "icons");
  fs.readdir(iconsDir, (err, files) => {
    if (err) {
      logger.error("Error reading icons directory:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const iconFiles = files.filter((file) => /\.(svg)$/i.test(file));
    res.json({ icons: iconFiles });
  });
});

// Use the main router
app.use(router);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

db.connectToDatabase(
  () => {
    logger.info("Connected to the database");
  },
  (error) => {
    logger.error("Error connecting to the database:", error);
  }
);

module.exports = app;
