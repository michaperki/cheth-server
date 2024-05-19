// controllers/GameController.js

const db = require("../../db");
const { GameNotFoundError } = require("../../utils/errors");

async function refreshContractBalance(req, res, next) {
  console.log("/refreshContractBalance route");
  try {
    const gameId = req.body.gameId;
    const game = await db.getGameById(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    console.log("game", game);

    const contractAddress = game.contract_address;
    // if the contract address is null, then the contract has not been created, so return an error
    if (!contractAddress) {
      return res.status(400).json({ error: "Contract not created" });
    }
    console.log("contractAddress", contractAddress);
    const balance = await chessContract.getContractBalance(contractAddress);
    console.log("balance", balance);
    await db.updateRewardPool(gameId, balance.toString());
    res.json({ message: "Data refreshed successfully" });
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
}

async function getGameCount(req, res, next) {
  try {
    const gameCount = await db.getGameCount();
    res.json({ count: gameCount });
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
}

async function getTotalWagered(req, res, next) {
  try {
    const totalWagered = await db.getTotalWagered();
    res.json({ totalWagered });
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
}

function handleError(res, error) {
  if (error instanceof GameNotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  res.status(500).json({ error: "Internal server error" });
}

module.exports = {
  refreshContractBalance,
  getGameCount,
  getTotalWagered,
  handleError,
};
