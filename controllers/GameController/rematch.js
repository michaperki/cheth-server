// controllers/GameController/requestRematch.js

const db = require('../../db');
const startGame = require('./startGame');

async function requestRematch(req, res, next) {

    // Get the game ID from the request body
    const gameId = req.body.gameId;

    // Get the user ID from the request body
    const userId = req.body.userId;

    // update the game status to rematch requested
    await db.requestRematch(gameId, userId);

    // get the game from the database
    const game = await db.getGameById(gameId);

    const from = userId;
    const to = game.player1_id === userId ? game.player2_id : game.player1_id;

    const wagerSize = game.wager_size;
    const timeControl = game.time_control;

    const message = JSON.stringify({ type: 'REMATCH_REQUESTED', gameId: gameId, from: from, to: to, wagerSize: wagerSize, timeControl: timeControl });


    // Broadcasting the message to all connected WebSocket clients
    Object.values(req.clients).forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            if (parseInt(ws.userId) === to) {
                ws.send(message);
            }
        }
    });
}

module.exports = { requestRematch };