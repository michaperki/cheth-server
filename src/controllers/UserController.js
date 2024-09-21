// controllers/UserController.js (Controller for user-related operations)
const NodeCache = require("node-cache");
const fetch = require("node-fetch");
const db = require("../db");
const { fetchLichessUserInfo } = require("../utils/lichessUtils");
const { logger } = require("../utils/LoggerUtils");
const { createSession } = require("../services/virtualLabsService");

const userCache = new NodeCache({ stdTTL: 600 }); // Set TTL to 10 minutes

const UserController = {
  async checkEligibility(req, res, next) {
    try {
      console.log('👄 ~ checkEligibility ~ req.body', req.body);
      const { lichessHandle } = req.body;

      // Check if the user already exists in the database
      const existingUser = await db.getUserByLichessHandle(lichessHandle);
      if (existingUser) {
        return res.json({
          isEligible: false,
          reason: "User already has an account",
        });
      }

      const userInfo = await fetchLichessUserInfo(lichessHandle);
      const config = await db.getConfig();

      // Check eligibility based on user info and configuration
      // Implementation of eligibility checks

      // Checking if the user's account is created before the specified date
      const createdBefore = new Date(
        config.find((item) => item.name === "created_before").value,
      );
      const userCreatedAt = new Date(userInfo.createdAt);
      if (userCreatedAt > createdBefore) {
        return res.json({
          isEligible: false,
          reason: "Account created after specified date",
        });
      }

      // If all checks passed, the user is eligible
      res.json({ isEligible: true });
    } catch (error) {
      next(error); // Pass error to error handling middleware
    }
  },

  async createUser(req, res, next) {
    try {
      const { lichessHandle, address } = req.body;
      const authToken = req.headers.authorization;
      const rollupId = process.env.VIRTUAL_LABS_ROLLUP_ID;

      logger.info(`Creating user with lichessHandle: ${lichessHandle} and address: ${address}`);

      // Fetch Lichess user info
      const userInfo = await fetchLichessUserInfo(lichessHandle);
      
      // Set ratings from Lichess data
      const bulletRating = userInfo.perfs?.bullet?.rating || 1500;
      const blitzRating = userInfo.perfs?.blitz?.rating || 1500;
      const rapidRating = userInfo.perfs?.rapid?.rating || 1500;
      const bulletGames = userInfo.perfs?.bullet?.games || 0;
      const blitzGames = userInfo.perfs?.blitz?.games || 0;
      const rapidGames = userInfo.perfs?.rapid?.games || 0;

      // Create player in VirtualLabs
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
      logger.info(`Rollup player created: ${JSON.stringify(rollupPlayer)}`);

      // Create or get session in VirtualLabs
      let virtualLabsSession = await createSession(address, authToken, rollupId);

      // Save or update user in local database
      const user = await db.upsertUser(
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
      logger.info(`User upserted`);

      try {
        const newSession = await db.createUserSession(user.user_id, virtualLabsSession.session._id);
        logger.info(`New session created: ${JSON.stringify(newSession)}`);
      } catch (error) {
        logger.error(`Error creating session: ${error.message}`);
        // Don't throw here, we want to return the user even if session creation fails
      }

      logger.info(`User creation process completed`);

      res.status(201).json({ 
        user: user,
        sessionId: virtualLabsSession.session._id
      });

    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      next(error);
    }
  },

  async checkUser(req, res, next) {
    logger.info("Checking user");
    try {
      const walletAddress = req.body.walletAddress;
      const userExists = await db.getUserByWalletAddress(walletAddress);

      if (userExists) {
        res.json({ userExists: true, username: userExists.username });
      } else {
        res.json({ userExists: false });
      }
    } catch (error) {
      next(error); // Pass error to error handling middleware
    }
  },

  async getUser(req, res, next) {
    try {
      const walletAddress = req.body.walletAddress;
      const cacheKey = `user_${walletAddress}`;
      
      let user = userCache.get(cacheKey);
      if (user === undefined) {
        user = await db.getUserByWalletAddress(walletAddress);
        userCache.set(cacheKey, user);
        logger.debug(`User data fetched from database for wallet: ${walletAddress}`);
      } else {
        logger.debug(`User data served from cache for wallet: ${walletAddress}`);
      }
      
      res.json(user);
    } catch (error) {
      logger.error(`Error fetching user data: ${error.message}`);
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const userId = req.params.userId;
      const cacheKey = `user_id_${userId}`;
      
      let user = userCache.get(cacheKey);
      if (user === undefined) {
        user = await db.getUserById(userId);
        userCache.set(cacheKey, user);
        logger.debug(`User data fetched from database for ID: ${userId}`);
      } else {
        logger.debug(`User data served from cache for ID: ${userId}`);
      }
      
      res.json(user);
    } catch (error) {
      logger.error(`Error fetching user data by ID: ${error.message}`);
      next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      const cacheKey = 'all_users';
      
      let users = userCache.get(cacheKey);
      if (users === undefined) {
        users = await db.getUsers();
        userCache.set(cacheKey, users);
        logger.debug('All users fetched from database');
      } else {
        logger.debug('All users served from cache');
      }
      
      res.json(users);
    } catch (error) {
      logger.error(`Error fetching all users: ${error.message}`);
      next(error);
    }
  },

  async setAvatar(req, res, next) {
    try {
      const { userId, avatar } = req.body;
      logger.debug(`Setting avatar for user ${userId}`);
      const user = await db.setAvatar(userId, avatar);
      
      // Update the cache
      const cacheKey = `user_id_${userId}`;
      userCache.set(cacheKey, user);
      
      res.json(user);
    } catch (error) {
      logger.error(`Error setting avatar: ${error.message}`);
      next(error);
    }
  },

  async getUserGames(req, res, next) {
    try {
      const userId = req.body.userId;
      const games = await db.getUserGames(userId);
      res.json(games);
    } catch (error) {
      next(error); // Pass error to error handling middleware
    }
  },

  async registerUser(req, res, next) {
    try {
      const { lichessHandle, walletAddress } = req.body;
      const authToken = req.headers.authorization;
      const rollupId = process.env.VIRTUAL_LABS_ROLLUP_ID;

      // First, create the player using PlayerChethController
      const playerResponse = await fetch(`${process.env.REACT_APP_SERVER_BASE_URL}/player/createPlayer`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lichessHandle, walletAddress })
      });

      if (!playerResponse.ok) {
        throw new Error(`Failed to create player: ${playerResponse.statusText}`);
      }

      const player = await playerResponse.json();

      // Now create a session for the user in Virtual Labs
      // const virtualLabsSession = await createSession(walletAddress, authToken);
      //
      // // Save the session ID to your local database
      // await db.createUserSession(player.user_id, virtualLabsSession.sessionId);

      res.status(201).json({ 
        user: player, 
        // sessionId: virtualLabsSession.sessionId 
      });
    } catch (error) {
      logger.error(`Error registering user: ${error.message}`);
      next(error);
    }
  },

  async getUserSession(req, res, next) {
    try {
      const userId = req.body.userId;
      const sessionId = req.body.sessionId;

      const userSession = await db.getUserSession(userId, sessionId);
      res.json(userSession);
    } catch (error) {
      next(error); // Pass error to error handling middleware
    }
  },
};

module.exports = UserController;
