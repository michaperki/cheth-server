// controllers/UserController.js (Controller for user-related operations)
const NodeCache = require("node-cache");
const db = require("../db");
const { fetchLichessUserInfo } = require("../utils/lichessUtils");
const { logger } = require("../utils/LoggerUtils"); // Import the logger instance and expressLogger middleware
const fetch = require("node-fetch");

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

  async addUser(req, res, next) {
      try {
          console.log('󰠰  ~ addUser ~ req.body', req.body);
          const { username, wallet_address } = req.body;
          const authToken = req.headers.authorization;
          const rollupId = process.env.VIRTUAL_LABS_ROLLUP_ID; // We'll store this in .env

          // Fetch user info from Lichess (we'll still use this for our local database)
          const userInfo = await fetchLichessUserInfo(username);
          const bullet_rating = userInfo.perfs.bullet.rating;
          const bullet_games = userInfo.perfs.bullet.games;
          const blitz_rating = userInfo.perfs.blitz.rating;
          const blitz_games = userInfo.perfs.blitz.games;
          const rapid_rating = userInfo.perfs.rapid.rating;
          const rapid_games = userInfo.perfs.rapid.games;

          console.log('👄 ~ addUser ~ userInfo bullet_rating', bullet_rating);

          // Create player in the virtual rollup system
          const createPlayerResponse = await fetch(`${process.env.VIRTUAL_LABS_API_URL}/player/cheth/createPlayer`, {
              method: 'POST',
              headers: {
                  'Authorization': authToken,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  address: wallet_address,
                  rollupId: rollupId
              })
          });

          if (!createPlayerResponse.ok) {
              throw new Error(`Failed to create player in rollup: ${createPlayerResponse.statusText}`);
          }

          const rollupPlayer = await createPlayerResponse.json();

          // Save player in local database
          const user = await db.addUser(
              username,
              wallet_address,
              bullet_rating,
              blitz_rating,
              rapid_rating,
              bullet_games,
              blitz_games,
              rapid_games,
              rollupPlayer.playerId // This is the ID returned by Virtual Labs
          );

          logger.info(`User created: ${JSON.stringify(user)}`);
          res.json(user);
      } catch (error) {
          logger.error(`Error adding user: ${error.message}`);
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
};

module.exports = UserController;
