require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server); // Create WebSocket server

app.use(express.json());
app.use(cors());
app.use('/api', routes);

const PORT = process.env.PORT || 5000;

// WebSocket event handlers
io.on('connection', (socket) => {
    console.log('Client connected');

    // Handle WebSocket events here
    socket.on('newGame', (data) => {
        console.log('New game:', data);
        // Implement new game logic here
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        await db.connectToDatabase();
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
});
