// playGame.js

const db = require('../../db');
const startGame = require('./startGame');


async function playGame(req, res, next) {
    console.log('/playGame route');
    try {
        const userId = req.body.userId;
        const timeControl = req.body.timeControl; // Get the time control from the request body
        const wagerSize = req.body.wagerSize; // Get the wager size from the request body

        // Check if there are any available games with matching time control and wager size
        const availableGames = await db.getAvailableGames(timeControl, wagerSize, userId);

        if (availableGames.length > 0) {
            // If there are available games, join the first one found
            const gameId = availableGames[0].game_id;
            await db.joinGame(gameId, userId);
            const dbGame = await db.getGameById(gameId);
            await startGame(dbGame, req.clients, wagerSize);
            res.json(dbGame);
        } else {
            // If no available games with matching criteria, create a new game
            const newGame = await db.createGame(userId, timeControl, wagerSize);
            res.json(newGame);
        }
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

module.exports = playGame;
