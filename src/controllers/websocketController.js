// websocketController.js

const wss = require('./websocketInstance'); // Assuming you have a WebSocket instance

function getOnlineUsersCount(req, res) {
    res.json({ count: wss.clients.size }); // Return the number of connected clients
}

module.exports = {
    getOnlineUsersCount
};
