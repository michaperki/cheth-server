// controllers/GameController.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

const db = require("../../db");
const { GameNotFoundError } = require("../../utils/errors");
const { loggerUtils } = require("../../utils/logger");

async function refreshContractBalance(req, res, next) {
  logger.debug("Refreshing contract balance");
  try {
    const gameId = req.body.gameId;
    const game = await db.getGameById(gameId);
    if (!game) {
      logger.warn(`Game not found: ${gameId}`);
      return res.status(404).json({ error: "Game not found" });
    }
    
    const contractAddress = game.contract_address;
    if (!contractAddress) {
      logger.warn(`Contract not created for game: ${gameId}`);
      return res.status(400).json({ error: "Contract not created" });
    }

    logger.debug(`Fetching balance for contract: ${contractAddress}`);
    const balance = await chessContract.getContractBalance(contractAddress);
    
    await db.updateRewardPool(gameId, balance.toString());
    logger.info(`Contract balance refreshed for game: ${gameId}`);
    res.json({ message: "Data refreshed successfully" });
  } catch (error) {
    logger.error("Error refreshing contract balance:", error);
    next(error);
  }
}

async function getGameCount(req, res, next) {
  try {
    let gameCount = cache.get("gameCount");
    if (gameCount === undefined) {
      gameCount = await db.getGameCount();
      cache.set("gameCount", gameCount);
      logger.debug("Game count fetched from database");
    } else {
      logger.debug("Game count served from cache");
    }
    res.json({ count: gameCount });
  } catch (error) {
    logger.error("Error fetching game count:", error);
    next(error);
  }
}

async function getTotalWagered(req, res, next) {
  try {
    let totalWagered = cache.get("totalWagered");
    if (totalWagered === undefined) {
      totalWagered = await db.getTotalWagered();
      cache.set("totalWagered", totalWagered);
      logger.debug("Total wagered fetched from database");
    } else {
      logger.debug("Total wagered served from cache");
    }
    res.json({ totalWagered });
  } catch (error) {
    logger.error("Error fetching total wagered:", error);
    next(error);
  }
}

function handleError(res, error) {
  if (error instanceof GameNotFoundError) {
    logger.warn("Game not found:", error.message);
    return res.status(404).json({ error: error.message });
  }
  logger.error("Internal server error:", error);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = {
  refreshContractBalance,
  getGameCount,
  getTotalWagered,
  handleError,
};
