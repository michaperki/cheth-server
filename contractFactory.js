const ethers = require('ethers');
const abi = require("./abis/ChessFactory.json");
const db = require('./db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = wallet.connect(provider);
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const createGame = async (gameId) => {
    // Convert entry fee and commission to wei
    const entryFeeInEther = ethers.parseEther("0.01");
    const commission = 5;

    const tx = await contract.createGame(entryFeeInEther, commission);
    const receipt = await tx.wait();

    // Subscribe to the GameCreated event
    contract.on("GameCreated", (game, creator) => {
        console.log("New game created. Game address:", game, "Creator:", creator);
        db.updateGameContractAddress(gameId, game);
    });

    return "Game created successfully!";
}

module.exports = {
    createGame,
};
