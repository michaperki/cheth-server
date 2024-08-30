require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const http = require("http");
const websocket = require("./websocket"); // Import the websocket function
const { logger, expressLogger } = require("./../dist/utils/LoggerUtils"); // Import the logger instance and expressLogger middleware
const router = require("./routes");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(expressLogger); // Use Pino middleware for logging

console.log("CORS_ORIGIN");
console.log(process.env.CORS_ORIGIN);

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Middleware to inject WebSocket instance into request object
app.use((req, res, next) => {
  req.broadcastToGame = websocket.broadcastToGame;
  next();
});

// Custom middleware for logging only necessary requests
app.use((req, res, next) => {
  if (req.originalUrl !== "/crypto/ethToUsd") {
    logger.info("Request completed", {
      req,
      res,
    });
  }
  next();
});

// add a route to get the icons
// the icons route should serve all the icons in the icons folder
app.use("/icons", express.static(path.join(__dirname, "icons")));

app.use("/allIcons", (req, res) => {
  const iconsDir = path.join(__dirname, "icons");

  fs.readdir(iconsDir, (err, files) => {
    if (err) {
      console.error("Error reading icons directory:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const iconFiles = files.filter((file) => /\.(svg)$/i.test(file));
    res.json({ icons: iconFiles });
  });
});

app.use(router);

// Initialize WebSocket and get the instance
try {
  websocket.initialize(server);
  logger.info("WebSocket initialized successfully");
} catch (error) {
  logger.error("Failed to initialize WebSocket:", error);
}

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
  },
);

module.exports = app;
