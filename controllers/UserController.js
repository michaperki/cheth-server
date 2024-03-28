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
    
            // Checking if the time control matches the configured time control
            const timeControl = config.find(item => item.name === 'time_control').value;
            if (userInfo.perfs[timeControl].games === 0) {
                return res.json({ isEligible: false, reason: 'No games in specified time control' });
            }
    
            // Checking if the user has played enough games
            const minGames = parseInt(config.find(item => item.name === 'min_games').value);
            if (userInfo.perfs[timeControl].games < minGames) {
                return res.json({ isEligible: false, reason: 'Not enough games played' });
            }
    
            // Checking if the user's rating is below the threshold
            const ratingThreshold = parseInt(config.find(item => item.name === 'rating_threshold').value);
            if (userInfo.perfs[timeControl].rating >= ratingThreshold) {
                return res.json({ isEligible: false, reason: 'User rating exceeds threshold' });
            }
    
            // If all checks passed, the user is eligible
            res.json({ isEligible: true });
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }    },

    async addUser(req, res, next) {
        try {
            const { lichessHandle, walletAddress, darkMode } = req.body;
    
            // get the rating from lichess
            const userInfo = await fetchLichessUserInfo(lichessHandle);
            const rating = userInfo.perfs.blitz.rating;
    
            const user = await db.addUser(lichessHandle, rating, walletAddress, darkMode);
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

    async getUserById(req, res, next) {
        try {
            const userId = req.params.userId;
            const user = await db.getUserById(userId);
            res.json(user);
        } catch (error) {
            next(error); // Pass error to error handling middleware
        }
    },
};

module.exports = UserController;
