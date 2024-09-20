
// controllers/PlayerChethController.js
const fetch = require("node-fetch");
const db = require("../db");
const { fetchLichessUserInfo } = require("../utils/lichessUtils");
const { logger } = require("../utils/LoggerUtils");

const PlayerChethController = {
  async createPlayer(req, res, next) {
    try {
      const { lichessHandle, walletAddress } = req.body;
      const authToken = req.headers.authorization;
      const rollupId = process.env.VIRTUAL_LABS_ROLLUP_ID; // Use the VirtualLabs rollup ID from env

      logger.info(`Creating player with lichessHandle: ${lichessHandle} and walletAddress: ${walletAddress}`);

      // Fetch Lichess user info (similar to addUser)
      const userInfo = await fetchLichessUserInfo(lichessHandle);
      const bullet_rating = userInfo.perfs.bullet.rating;
      const bullet_games = userInfo.perfs.bullet.games;
      const blitz_rating = userInfo.perfs.blitz.rating;
      const blitz_games = userInfo.perfs.blitz.games;
      const rapid_rating = userInfo.perfs.rapid.rating;
      const rapid_games = userInfo.perfs.rapid.games;

      // Create player in VirtualLabs rollup
      const createPlayerResponse = await fetch(`${process.env.VIRTUAL_LABS_API_URL}/player/cheth/createPlayer`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: walletAddress,
          rollupId: rollupId
        })
      });

      if (!createPlayerResponse.ok) {
        throw new Error(`Failed to create player in rollup: ${createPlayerResponse.statusText}`);
      }

      const rollupPlayer = await createPlayerResponse.json();
      logger.info(`Player created in rollup with ID: ${rollupPlayer.playerId}`);

      // Save player in local database
      const player = await db.addUser(
        lichessHandle,
        walletAddress,
        bullet_rating,
        blitz_rating,
        rapid_rating,
        bullet_games,
        blitz_games,
        rapid_games,
        rollupPlayer.playerId
      );

      res.json(player);
    } catch (error) {
      logger.error(`Error creating player: ${error.message}`);
      next(error); // Pass error to error-handling middleware
    }
  }
};

module.exports = PlayerChethController;
