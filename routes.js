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

async function checkEligibility(userInformation) {
    // Retrieve config values from the database
    const config = await db.getConfig();
    console.log(config);
    console.log(userInformation);

    // Perform eligibility check based on userInformation and config values
    // Return true or false based on the check
    return true;
}

module.exports = router;
