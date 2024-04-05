// controllers/UserController.js (Controller for user-related operations)
const db = require('../db');
const { fetchLichessUserInfo } = require('../utils/lichessUtils');
const { logger } = require('../utils/LoggerUtils'); // Import the logger instance and expressLogger middleware
const UserController = {
    async checkEligibility(req, res, next) {
        try {
            const lichessHandle = req.body.lichessHandle;
    
            // Check if the user already exists in the database
            const existingUser = await db.getUserByLichessHandle(lichessHandle);
            if (existingUser) {
                return res.json({ isEligible: false, reason: 'User already has an account' });
            }
    
            const userInfo = await fetchLichessUserInfo(lichessHandle);
            const config = await db.getConfig();
    
            // Check eligibility based on user info and configuration
            // Implementation of eligibility checks
    
            // Checking if the user's account is created before the specified date
            const createdBefore = new Date(config.find(item => item.name === 'created_before').value);
            const userCreatedAt = new Date(userInfo.createdAt);
            if (userCreatedAt > createdBefore) {
                return res.json({ isEligible: false, reason: 'Account created after specified date' });
            }
    
            // If all checks passed, the user is eligible
            res.json({ isEligible: true });
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }    },

    async addUser(req, res, next) {
        try {
            const { lichessHandle, walletAddress } = req.body;
    
            // get the rating from lichess
            const userInfo = await fetchLichessUserInfo(lichessHandle);
            const bullet_rating = userInfo.perfs.bullet.rating;
            const bullet_games = userInfo.perfs.bullet.games;
            const blitz_rating = userInfo.perfs.blitz.rating;
            const blitz_games = userInfo.perfs.blitz.games;
            const rapid_rating = userInfo.perfs.rapid.rating;
            const rapid_games = userInfo.perfs.rapid.games;
    
            const user = await db.addUser(lichessHandle, walletAddress, bullet_rating, blitz_rating, rapid_rating, bullet_games, blitz_games, rapid_games);
            res.json(user);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },
    async checkUser(req, res, next) {
        logger.info('Checking user');
        try {
            const walletAddress = req.body.walletAddress;
            const userExists = await db.getUserByWalletAddress(walletAddress);
    
            if (userExists) {
                res.json({ userExists: true, username: userExists.username });
            }
            else {
                res.json({ userExists: false });
            }
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },

    async getUser(req, res, next) {
        try {
            const walletAddress = req.body.walletAddress;
            const user = await db.getUserByWalletAddress(walletAddress);
            res.json(user);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },
    
    async getUsers(req, res, next) {
        try {
            const users = await db.getUsers();
            res.json(users);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },

    async getUserById(req, res, next) {
        try {
            const userId = req.params.userId;
            const user = await db.getUserById(userId);
            res.json(user);
        } catch (error) {
            next(error); // Pass error to error handling middleware
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

    async setAvatar(req, res, next) {
        try {
            const { userId, avatar } = req.body;
            console.log('Setting avatar for user', userId);
            const user = await db.setAvatar(userId, avatar);
            res.json(user);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    }
};

module.exports = UserController;
