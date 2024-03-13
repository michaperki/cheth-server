const express = require('express');
const router = express.Router();
const db = require('./db');

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
    const headers = {
        Authorization: 'Bearer ' + process.env.LICHESS_TOKEN,
    };
    const response = await fetch(`https://lichess.org/api/user/${lichessHandle}`, { headers });
    if (!response.ok) {
        throw new Error('Failed to fetch Lichess user information');
    }
    const userInformation = await response.json();
    return userInformation;
}

router.post('/checkEligibility', validateRequestBody, async (req, res, next) => {
    try {
        const lichessHandle = req.body.lichessHandle;
        const userInfo = await fetchLichessUserInfo(lichessHandle);
        const config = await db.getConfig();

        // Check eligibility based on user info and configuration
        // Implementation of eligibility checks

        const createdBefore = new Date(config.find(item => item.name === 'created_before').value);
        const userCreatedAt = new Date(userInfo.createdAt);
        if (userCreatedAt > createdBefore) {
            return res.json({ isEligible: false, reason: 'Account created after specified date' });
        }

        const timeControl = config.find(item => item.name === 'time_control').value;
        if (userInfo.perfs[timeControl].games === 0) {
            return res.json({ isEligible: false, reason: 'No games in specified time control' });
        }

        const minGames = parseInt(config.find(item => item.name === 'min_games').value);
        if (userInfo.perfs[timeControl].games < minGames) {
            return res.json({ isEligible: false, reason: 'Not enough games played' });
        }

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

module.exports = router;
