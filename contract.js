const ethers = require('ethers');
const abi = require("./abis/Chess.json");
const db = require('./db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(new ethers.JsonRpcProvider(process.env.RPC_URL));
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const joinGame = async () => {
    try {
        const game = await contract.joinGame();
        console.log('Game joined:', game);
        return game;
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = {
    joinGame,
};