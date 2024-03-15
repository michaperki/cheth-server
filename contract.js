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
        console.log('Game ID:', gameId);
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
        console.log('Contract address:', contract.target);
        console.log('Wallet address:', wallet.address);
        console.log('Game ID:', gameId);
        const tx = await contract.fundGame(gameId, { value: ethers.parseEther('.00001'), gasLimit: 3000000 });
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

contract.on('JoinedGame', (gameId, playerTwo) => {
    console.log('Game joined:', gameId, playerTwo);
});

contract.on('GameFinished', (gameId, winner, reward) => {
    console.log('Game finished:', gameId, winner, reward);
});

module.exports = {
    startGame,
    fundGame
};
