const express = require('express');
const router = express.Router();
const db = require('./db');
const contract = require('./contract');
const WebSocket = require('ws'); // Import WebSocket class
const wss = require('./websocket'); // Assuming you export the WebSocket server instance from websocket.js

// Middleware for error handling
router.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// Middleware for request validation
function validateRequestBody(req, res, next) {
    if (!req.body || !req.body.lichessHandle) {
        return res.status(400).json({ error: 'Missing lichessHandle in request body' });
    }
    next();
}

async function fetchLichessUserInfo(lichessHandle) {
    try {
        const headers = {
            Authorization: 'Bearer ' + process.env.LICHESS_TOKEN,
        };
        console.log('fetching lichess user info');
        console.log('lichessHandle', lichessHandle);
        console.log('process.env.LICHESS_TOKEN', process.env.LICHESS_TOKEN);
        // log the full url
        console.log(`https://lichess.org/api/user/${lichessHandle}`);
        const response = await fetch(`https://lichess.org/api/user/${lichessHandle}`, { headers });

        if (!response.ok) {
            throw new Error('Failed to fetch Lichess user information: ' + response.statusText);
        }

        const userInformation = await response.json();
        return userInformation;
    } catch (error) {
        console.error('Error fetching Lichess user information:', error);
        throw error;
    }
}

router.post('/checkEligibility', validateRequestBody, async (req, res, next) => {
    console.log('/checkEligibility route')
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
    }
});

router.post('/addUser', validateRequestBody, async (req, res, next) => {
    console.log('/addUser route')
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
});

router.post('/checkUser', async (req, res, next) => {
    console.log('/checkUser route')
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
});

router.post('/getUserInfo', async (req, res, next) => {
    console.log('/getUserInfo route')
    try {
        console.log('req.body', req.body);
        const walletAddress = req.body.walletAddress;
        const user = await db.getUserByWalletAddress(walletAddress);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        } else {
            res.json(user);
        }
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.post('/playGame', async (req, res, next) => {
    console.log('/playGame route')
    try {
        const userId = req.body.userId;
        const game = await db.playGame(userId);
        console.log('game', game);
        // if the game state is 1, then the game is started
        if (game[0].state === '1') {
            // Send a message to the client to start the game
            console.log('game started');
            const message = JSON.stringify({ type: 'START_GAME' });
            console.log('req.wss', req.wss); // Ensure req.wss is accessible

            // Broadcasting the message to all connected WebSocket clients
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
        res.json(game);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

router.post('/cancelGame', async (req, res, next) => {
    console.log('/cancelGame route')
    try {
        contract.cancelGame();
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

module.exports = router;