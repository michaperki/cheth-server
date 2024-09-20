// utils/lichessUtils.js (Utility functions for Lichess API interaction)
const fetch = require('node-fetch');

async function fetchLichessUserInfo(lichessHandle) {
    try {
        const headers = {
            Authorization: 'Bearer ' + process.env.LICHESS_TOKEN,
        };
        console.log('♟️ ~ fetchLichessUserInfo ~ lichessHandle', lichessHandle);
        const response = await fetch(`https://lichess.org/api/user/${lichessHandle}`, { headers });

        if (!response.ok) {
            throw new Error('Failed to fetch Lichess user information: ' + response.statusText);
        }

        const userInformation = await response.json();
        console.log('♟️ ~ fetchLichessUserInfo ~ userInformation', userInformation);
        return userInformation;
    } catch (error) {
        console.error('Error fetching Lichess user information:', error);
        throw error;
    }
}


async function createChallenge(player1Username, player2Username, timeControl) {
    console.log('createChallenge function');
    console.log('player1Username', player1Username);
    console.log('player2Username', player2Username);
    console.log('timeControl', timeControl);
    try {
        const lichessApiUrl = 'https://lichess.org/api/challenge/open';
        const headers = {
            Authorization: 'Bearer ' + process.env.LICHESS_TOKEN,
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const body = new URLSearchParams({
            variant: 'standard',
            rated: 'false',
            color: 'random',
            'clock.limit': timeControl,
            'clock.increment': '0',
            users: `${player1Username},${player2Username}`,
            rules: 'noRematch,noGiveTime,noEarlyDraw',
            name: 'Cheth Game'
        });

        const response = await fetch(lichessApiUrl, {
            method: 'POST',
            headers: headers,
            body: body
        });

        console.log('Response status code:', response.status);

        if (!response.ok) {
            console.error('Error response:', await response.text());
            throw new Error('Failed to create open challenge on Lichess');
        }

        const challengeData = await response.json();
        return challengeData;
    }
    catch (error) {
        console.error('Error creating challenge:', error);
        throw error;
    }
}

module.exports = { fetchLichessUserInfo, createChallenge };
