const ethers = require('ethers');
const abi = require("./abis/ChessGame.json");
const db = require('./db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(new ethers.JsonRpcProvider(process.env.RPC_URL));
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const startGame = async () => {
    try {
        console.log('Starting new game...');
        console.log('Contract address:', contract.target);
        console.log('Wallet address:', wallet.address);
        //const tx = await contract.startGame({ value: ethers.parseEther('.00001'), gasLimit: 3000000 });
        const tx = await contract.startGame();
        const receipt = await tx.wait();
        console.log('Game started:', receipt);
        return receipt;
    } catch (error) {
        console.error('Error starting game:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
};

const fundGame = async (gameId) => {
    try {
        console.log('Funding game...');
        // error: {code: -32603, message: 'nonce too low: next nonce 631, tx nonce 630'
        const nonce = await wallet.getTransactionCount();
        console.log('Contract address:', contract.target);
        console.log('Wallet address:', wallet.address);
        console.log('Game ID:', gameId);
        const entryFee = ethers.utils.parseEther('.00001');
        console.log('Entry fee:', entryFee);
        const tx = await contract.fundGame(gameId, { value: entryFee, nonce });

        const receipt = await tx.wait();
        console.log('Game funded:', receipt);
        return receipt;
    } catch (error) {
        console.error('Error funding game:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
};

contract.on('GameStarted', async (gameId, playerOne, entryFee) => {
    console.log('Game started:', gameId, playerOne, entryFee);

    await db.updateGameState(gameId, 2); // Assuming 2 is the state for "game started" in your database
    // CONVERT entryFee to your local currency and update the reward pool in your database
    
    await db.updateRewardPool(gameId, entryFee.toString()); // Convert BigInt to string
    
});

contract.on('GameFunded', async (gameId, player, amount) => {
    console.log('Game funded:', gameId, player, amount);

    // Update the reward pool in your database
    await db.updateRewardPool(gameId, amount.toString()); // Convert BigInt to string
});

contract.on('GameFinished', (gameId, winner, reward) => {
    console.log('Game finished:', gameId, winner, reward);
});

module.exports = {
    startGame,
    fundGame
};
