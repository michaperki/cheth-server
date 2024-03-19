const ethers = require('ethers');
const abi = require("./abis/ChessFactory.json");
const db = require('./db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const signer = wallet.connect(provider);
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const createGame = async () => {
    // Convert entry fee and commission to wei
    const entryFeeInEther = ethers.parseEther("0.01");
    const commissionInEther = ethers.parseEther("0.05"); // 5% commission

    const tx = await contract.createGame(entryFeeInEther, commissionInEther);
    const receipt = await tx.wait();
    console.log('receipt', receipt);
    const gameId = receipt.events[0].args.gameId;
    return gameId;
}

module.exports = {
    createGame,
};
