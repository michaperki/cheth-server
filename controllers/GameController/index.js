// gameController.js

const playGame = require('./playGame');
const startGame = require('./startGame');
const { getGame, getGames, getAllGames } = require('./fetchGame');
const { cancelGamePairing, cancelGame, reportGameOver, forceDraw, deleteGame } = require('./endGame');
const { refreshContractBalance, getGameCount, getTotalWagered } = require('./utilis');
const { requestRematch, acceptRematch, declineRematch, cancelRematch } = require('./rematch');

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
    getTotalWagered,
    requestRematch,
    acceptRematch,
    declineRematch,
    cancelRematch
};
