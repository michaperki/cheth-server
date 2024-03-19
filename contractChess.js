const ethers = require('ethers');
const abi = require("./abis/Chess.json");
const db = require('./db'); // Import your database module

const cancelGame = async (contractAddress) => {
    const contract = new ethers.Contract(contractAddress, abi.abi, signer);
    await contract.cancelGame();
}

const finishGame = async (contractAddress) => {
    const contract = new ethers.Contract(contractAddress, abi.abi, signer);
    await contract.finishGame();
}

module.exports = {
    cancelGame,
    finishGame
};