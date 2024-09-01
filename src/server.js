require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs").promises;
const { logger, expressLogger } = require("./utils/LoggerUtils");
const db = require("./db");
const websocket = require("./websocket");
const router = require("./routes");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(expressLogger);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// WebSocket setup
const { wss, clients } = websocket(server);
app.use((req, res, next) => {
  req.wss = wss;
  req.clients = clients;
  next();
});

// Static file serving
app.use("/icons", express.static(path.join(__dirname, "icons")));

// Routes
app.use("/allIcons", async (req, res) => {
  try {
    const iconsDir = path.join(__dirname, "icons");
    const files = await fs.readdir(iconsDir);
    const iconFiles = files.filter((file) => /\.svg$/i.test(file));
    res.json({ icons: iconFiles });
  } catch (err) {
    logger.error("Error reading icons directory:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use(router);

// Server initialization
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

// Database connection
db.connectToDatabase()
  .then(() => logger.info("Connected to the database"))
  .catch((error) => logger.error("Error connecting to the database:", error));

module.exports = app;
