// gameController.js

const findOpponent = require("./findOpponent");
const startGame = require("./startGame");
const { getGame, getGames, getAllGames } = require("./fetchGame");
const {
  cancelGamePairing,
  cancelGame,
  reportGameOver,
  forceDraw,
  deleteGame,
} = require("./endGame");
const {
  refreshContractBalance,
  getGameCount,
  getTotalWagered,
} = require("./utils");
const {
  requestRematch,
  acceptRematch,
  declineRematch,
  cancelRematch,
} = require("./rematch");
const { lockGame, unlockGame, reportIssue } = require("./lockGame");

module.exports = {
  findOpponent,
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
  cancelRematch,
  lockGame,
  unlockGame,
  reportIssue,
};
