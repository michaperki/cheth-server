// cryptoController.js

const fetch = require('node-fetch');

async function getEthToUsd(req, res, next) {
    try {
        const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
        if (!response.ok) {
            throw new Error('Failed to fetch ETH to USD exchange rate');
        }
        const data = await response.json();
        res.json(data.USD);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
}

module.exports = {
    getEthToUsd
};
