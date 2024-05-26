const db = require('../../db');
const startGame = require('./startGame');

async function findOpponent(req, res, next) {
    console.log('/findOpponent route');
    try {
        const userId = req.body.userId;
        const timeControl = req.body.timeControl; // Get the time control from the request body
        const wagerSize = req.body.wagerSize; // Get the wager size from the request body

        console.log(`findOpponent: userId=${userId}, timeControl=${timeControl}, wagerSize=${wagerSize}`);

        // Convert and validate the time control
        const timeControlInt = parseInt(timeControl, 10);
        if (![60, 180, 300].includes(timeControlInt)) {
            console.error('Invalid time control:', timeControlInt);
            res.status(400).json({ error: 'Invalid time control' });
            return;
        }

        console.log(`findOpponent: Valid time control=${timeControlInt}`);

        // Retrieve the user's rating based on the time control
        const user = await db.getUserById(userId);
        let userRating;
        if (timeControlInt === 60) {
            userRating = user.bullet_rating;
        } else if (timeControlInt === 180 || timeControlInt === 300) {
            userRating = user.blitz_rating;
        } else {
            console.error('Invalid time control:', timeControlInt);
            res.status(400).json({ error: 'Invalid time control' });
            return;
        }

        console.log(`findOpponent: userRating=${userRating}`);

        // Check if there are any available games with matching time control, wager size, and rating range
        const availableGames = await db.getAvailableGames(timeControlInt, wagerSize, userId, userRating);

        if (availableGames.length > 0) {
            console.log(`findOpponent: Found ${availableGames.length} available games to join`);

            // If there are available games, join the first one found
            const gameId = availableGames[0].game_id;
            await db.joinGame(gameId, userId);
            const dbGame = await db.getGameById(gameId);
            await startGame(dbGame, req.clients, wagerSize);
            res.json(dbGame);
        } else {
            console.log('findOpponent: No available games found, creating a new game');

            // If no available games with matching criteria, create a new game
            const newGame = await db.createGame(userId, timeControlInt, wagerSize);
            res.json(newGame);
        }
    } catch (error) {
        console.error('Error finding opponent:', error);
        next(error); // Pass error to error handling middleware
    }
}

module.exports = findOpponent;

