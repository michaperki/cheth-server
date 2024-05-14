const http = require('http');
const app = require('./app');
const db = require('./db');
const websocket = require('./websocket'); // Import the websocket function
const { logger } = require('./utils/LoggerUtils');

const server = http.createServer(app);

// Initialize WebSocket and attach it to the app
const { wss, clients } = websocket(server);
app.wss = wss;
app.clients = clients;

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
});

db.connectToDatabase(
    () => {
        logger.info('Connected to the database');
    },
    (error) => {
        logger.error('Error connecting to the database:', error);
    }
);

module.exports = server;

