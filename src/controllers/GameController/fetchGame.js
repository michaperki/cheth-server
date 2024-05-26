// controllers/GameController.js

const db = require('../../db');

async function getGame(req, res, next) {
    try {
        const gameId = req.params.gameId;
        const game = await db.getGameById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

async function getGames(req, res, next) {
    try {
        const games = await db.getGames();
        res.json(games);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

async function getAllGames(req, res, next) {
    try {
        const games = await db.getAllGames();
        res.json(games);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

module.exports = {
    getGame,
    getGames,
    getAllGames
};