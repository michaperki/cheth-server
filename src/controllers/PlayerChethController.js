// controllers/PlayerChethController.js
const fetch = require("node-fetch");
const db = require("../db");
const { fetchLichessUserInfo } = require("../utils/lichessUtils");
const { logger } = require("../utils/LoggerUtils");
const { createSession } = require("../services/virtualLabsService");

const PlayerChethController = {
  async createPlayer(req, res, next) {
    try {
      const { lichessHandle, address } = req.body;
      const authToken = req.headers.authorization;
      const rollupId = process.env.VIRTUAL_LABS_ROLLUP_ID;

      logger.info(`🐾 SERVER - CONTROLLERS - PLAYER CONTROLLER 🐾`);

      logger.info(`Request body: ${JSON.stringify(req.body)}`);
      
      logger.info(`Creating player with lichessHandle: ${lichessHandle} and address: ${address}`);
      logger.info(`The username (shouldn't exist) provided is: ${req.body.username}`);
      
      // log the token in the console
      logger.info(`Authorization token: ${authToken}`);
      // Fetch Lichess user info
      const userInfo = await fetchLichessUserInfo(lichessHandle);
      
      // Set ratings from Lichess data
      const bulletRating = userInfo.perfs?.bullet?.rating || 1500;
      const blitzRating = userInfo.perfs?.blitz?.rating || 1500;
      const rapidRating = userInfo.perfs?.rapid?.rating || 1500;
      const bulletGames = userInfo.perfs?.bullet?.games || 0;
      const blitzGames = userInfo.perfs?.blitz?.games || 0;
      const rapidGames = userInfo.perfs?.rapid?.games || 0;

      // Create or get player in VirtualLabs
      const createPlayerResponse = await fetch(`${process.env.VIRTUAL_LABS_API_URL}/player/cheth/createPlayer`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: address,
          rollupId: rollupId
        })
      });
      
      if (!createPlayerResponse.ok) {
        throw new Error(`Failed to create player in rollup: ${createPlayerResponse.statusText}`);
      }
      
      const rollupPlayer = await createPlayerResponse.json();
      // log the progress
      logger.info(`Rollup player created: ${JSON.stringify(rollupPlayer)}`);

      // Create or get session in VirtualLabs
      let virtualLabsSession;
      try {
        const createSessionResponse = await fetch(`${process.env.VIRTUAL_LABS_API_URL}/session/createSession`, {
          method: 'POST',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rollupId: rollupId,
            user: address,
            token: process.env.VIRTUAL_LABS_TOKEN_ADDRESS,
            depositAmount: 0
          })
        });

        if (!createSessionResponse.ok) {
          const errorData = await createSessionResponse.json();
          if (errorData.message.includes("You have at least one active session")) {
            // If session already exists, fetch the existing session
            const getSessionsResponse = await fetch(`${process.env.VIRTUAL_LABS_API_URL}/session/getSessions?user=${address}`, {
              headers: { 'Authorization': authToken }
            });
            if (!getSessionsResponse.ok) {
              throw new Error(`Failed to fetch existing session: ${getSessionsResponse.statusText}`);
            }
            const sessions = await getSessionsResponse.json();
            virtualLabsSession = sessions[0]; // Assume the first session is the active one
          } else {
            throw new Error(`Failed to create session in Virtual Labs: ${errorData.message}`);
          }
        } else {
          virtualLabsSession = await createSessionResponse.json();
          logger.info(`Session created: ${JSON.stringify(virtualLabsSession)}`);
        }
      } catch (error) {
        logger.error(`Error handling session: ${error.message}`);
        throw error;
      }

      // Save or update player in local database
      const player = await db.upsertUser(
        lichessHandle,
        address,
        bulletRating,
        blitzRating,
        rapidRating,
        bulletGames,
        blitzGames,
        rapidGames,
        rollupPlayer.playerId
      );
      logger.info(`Player upserted`);

    try {
      const newSession = await db.createUserSession(player.user_id, virtualLabsSession.session._id);
      logger.info(`New session created: ${JSON.stringify(newSession)}`);
    } catch (error) {
      logger.error(`Error creating session: ${error.message}`);
      // Don't throw here, we want to return the user even if session creation fails
    }

    logger.info(`Player creation process completed`);

    res.status(201).json({ 
      user: player,
      sessionId: virtualLabsSession.session._id
    });

    } catch (error) {
      logger.error(`Error creating player: ${error.message}`);
      next(error);
    }
  }
};

module.exports = PlayerChethController;
