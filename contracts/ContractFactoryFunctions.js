const ethers = require('ethers');
const abi = require("../abis/ChessFactory.json");
const db = require('../db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const createGame = async (gameId) => {
    try {
        // Convert entry fee and commission to wei
        const entryFeeInEther = ethers.parseEther("0.01");
        const commission = 5;

        // Send the transaction to create the game
        const tx = await contract.createGame(entryFeeInEther, commission);
        console.log("Transaction hash:", tx.hash);
        
        // Save the transaction hash to the database
        await db.updateTransactionHash(gameId, tx.hash);

        // Wait for the transaction to be mined
        console.log("Waiting for the transaction to be mined...");
        const receipt = await tx.wait();
        console.log(receipt);
        console.log("Transaction was mined!");
        
        return "Game created successfully!";
    } catch (error) {
        console.error("Error creating game:", error);
        throw error;
    }
}

module.exports = {
    createGame,
};