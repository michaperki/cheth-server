require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes');
const http = require('http');

const app = express();
const server = http.createServer(app); // Create HTTP server

app.use(express.json());
app.use(cors());
app.use('/api', routes);

const PORT = process.env.PORT || 5000;

// Connect to the WebSocket server
const websocket = require('./websocket')(server);


server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

    // Send a message to all connected clients
    websocket.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('Hello from the server!');
        }
    });

    // Listen for incoming WebSocket connections
    websocket.on('connection', ws => {
        console.log('Client connected');
    });
});

// Connect to the database
db.connectToDatabase(
    () => {
        console.log('Connected to the database');
    },
    (error) => {
        console.error('Error connecting to the database:', error);
    }
);

