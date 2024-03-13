const express = require('express');
const router = express.Router();
const db = require('./db');

router.post('/checkEligibility', async (req, res) => {
    try {
        const lichessHandle = req.body.lichessHandle;
        const userInformation = await fetchLichessUserInfo(lichessHandle);
        const isEligible = await checkEligibility(userInformation);
        res.json({ isEligible });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function fetchLichessUserInfo(lichessHandle) {
    const headers = {
        Authorization: 'Bearer ' + process.env.LICHESS_TOKEN,
      };
    const response = await fetch(`https://lichess.org/api/user/${lichessHandle}`, { headers });
    const userInformation = await response.json();
    return userInformation;
}

router.post('/checkEligibility', async (req, res) => {
    try {
        console.log('Request body:', req.body);
        const lichessHandle = req.body.lichessHandle;
        const userInfo = await fetchLichessUserInfo(lichessHandle);
        const config = await db.getConfig();

        console.log('User info:', userInfo);
        console.log('Config data:', config);

        // Check if the user's account is created before the specified date
        const createdBefore = new Date(config.find(item => item.name === 'created_before').value);
        const userCreatedAt = new Date(userInfo.createdAt);
        if (userCreatedAt > createdBefore) {
            return res.json({ isEligible: false, reason: 'Account created after specified date' });
        }

        console.log('User account created before specified date');

        // Check if the time control matches the configured time control
        const timeControl = config.find(item => item.name === 'time_control').value;
        if (userInfo.perfs[timeControl].games === 0) {
            return res.json({ isEligible: false, reason: 'No games in specified time control' });
        }

        console.log('User has played games in specified time control');

        // Check if the user has played enough games
        const minGames = parseInt(config.find(item => item.name === 'min_games').value);
        if (userInfo.perfs[timeControl].games < minGames) {
            return res.json({ isEligible: false, reason: 'Not enough games played' });
        }

        console.log('User has played enough games');

        // Check if the user's rating is below the threshold
        const ratingThreshold = parseInt(config.find(item => item.name === 'rating_threshold').value);
        if (userInfo.perfs[timeControl].rating >= ratingThreshold) {
            return res.json({ isEligible: false, reason: 'User rating exceeds threshold' });
        }

        console.log('User rating is below threshold');

        // If all checks passed, the user is eligible
        res.json({ isEligible: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
