// controllers/GameController/requestRematch.js

const db = require('../../db');
const startGame = require('./startGame');
const WebSocket = require('ws');


async function requestRematch(req, res, next) {

    // Get the game ID from the request body
    const gameId = req.body.gameId;

    // Get the user ID from the request body
    const userId = req.body.userId;

    console.log('requestRematch', gameId, userId);

    // update the game status to rematch requested
    await db.requestRematch(gameId, userId);

    // get the game from the database
    const game = await db.getGameById(gameId);

    console.log('game', game);

    const from = userId;
    const to = game.player1_id === userId ? game.player2_id : game.player1_id;

    console.log('from', from);
    console.log('to', to);

    const wagerSize = game.wager;
    const timeControl = game.time_control;

    console.log('wagerSize', wagerSize);
    console.log('timeControl', timeControl);

    const message = JSON.stringify({ type: 'REMATCH_REQUESTED', gameId: gameId, from: from, to: to, wagerSize: wagerSize, timeControl: timeControl });

    console.log('message', message);

    // Broadcasting the message to all connected WebSocket clients
    req.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            if (parseInt(client.userId) === to || parseInt(client.userId) === from) {
                client.send(message);
            }
        }
    });
}

async function acceptRematch(req, res, next) {
    try {
        const { gameId, userId } = req.body;
        console.log('acceptRematch', gameId, userId);

        // Update the game status and get updated game details
        await db.acceptRematch(gameId, userId);
        const game = await db.getGameById(gameId);
        console.log('game', game);

        const opponentId = game.player1_id === userId ? game.player2_id : game.player1_id;
        const { wager, time_control: timeControl } = game;
        console.log('Opponent ID:', opponentId, 'Wager Size:', wager, 'Time Control:', timeControl);

        // Notify players about the rematch acceptance
        sendRematchAcceptedMessage(req.wss.clients, gameId, userId, opponentId, wager, timeControl);

        // Start a new game
        const newGame = await initiateNewGame(userId, opponentId, timeControl, wager, req.wss.clients);

        res.json(newGame);
    } catch (error) {
        next(error);
    }
}

// Helper function to send rematch accepted message to WebSocket clients
function sendRematchAcceptedMessage(clients, gameId, fromUserId, toUserId, wagerSize, timeControl) {
    const message = JSON.stringify({ 
        type: 'REMATCH_ACCEPTED', 
        gameId, 
        from: fromUserId, 
        to: toUserId, 
        wagerSize, 
        timeControl 
    });

    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            if (parseInt(client.userId) === toUserId || parseInt(client.userId) === fromUserId) {
                client.send(message);
            }
        }
    });
}

// Helper function to initiate a new game
async function initiateNewGame(player1Id, player2Id, timeControl, wagerSize, clients) {
    console.log('Initiating new game:', player1Id, player2Id, timeControl, wagerSize);
    const newGame = await db.createGame(player1Id, timeControl, wagerSize);
    console.log('New game created:', newGame);
    const newGameId = newGame.game_id;
    console.log('New game ID:', newGameId);
    const dbGame = await db.joinGame(newGameId, player2Id);
    console.log('DB game:', dbGame);
    await startGame(dbGame, clients, wagerSize);
    return dbGame;
}

module.exports = { requestRematch, acceptRematch };