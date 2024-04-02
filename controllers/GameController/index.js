// gameController.js

const playGame = require('./playGame');
const startGame = require('./startGame');
const {
    getGame,
    getGames,
    getAllGames,
    cancelGamePairing,
    cancelGame,
    reportGameOver,
    forceDraw,
    deleteGame,
    refreshContractBalance,
    getGameCount,
    getTotalWagered
} = require('./otherGameFunctions');

module.exports = {
    playGame,
    startGame,
    getGame,
    getGames,
    getAllGames,
    cancelGamePairing,
    cancelGame,
    reportGameOver,
    forceDraw,
    deleteGame,
    refreshContractBalance,
    getGameCount,
    getTotalWagered
};
