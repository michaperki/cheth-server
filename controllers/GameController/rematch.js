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

    // Get the game ID from the request body
    const gameId = req.body.gameId;

    // Get the user ID from the request body
    const userId = req.body.userId;

    console.log('acceptRematch', gameId, userId);

    // update the game status to rematch requested
    await db.acceptRematch(gameId, userId);

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

    const message = JSON.stringify({ type: 'REMATCH_ACCEPTED', gameId: gameId, from: from, to: to, wagerSize: wagerSize, timeControl: timeControl });

    console.log('message', message);

    // Broadcasting the message to all connected WebSocket clients
    req.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            if (parseInt(client.userId) === to || parseInt(client.userId) === from) {
                client.send(message);
            }
        }
    });

    // start the game
    const newGame = await db.createGame(from, timeControl, wagerSize);
    await db.joinGame(newGame.game_id, to);
    const dbGame = await db.getGameById(newGame.game_id);
    await db.startGame(dbGame, req.wss, wagerSize);



}

module.exports = { requestRematch, acceptRematch };