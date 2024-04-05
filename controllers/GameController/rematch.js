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

    const wagerSize = game.wager_size;
    const timeControl = game.time_control;

    console.log('wagerSize', wagerSize);
    console.log('timeControl', timeControl);

    const message = JSON.stringify({ type: 'REMATCH_REQUESTED', gameId: gameId, from: from, to: to, wagerSize: wagerSize, timeControl: timeControl });

    console.log('message', message);

    // print whether or not the req.clients object contains the user ID
    console.log("first client userId", req.clients[0].userId);

    // Broadcasting the message to all connected WebSocket clients
    Object.values(req.clients).forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log('ws.userId', ws.userId);
            if (parseInt(ws.userId) === to) {
                ws.send(message);
            }
        }
    });
}

module.exports = { requestRematch };