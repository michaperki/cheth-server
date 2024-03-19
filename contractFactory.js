const ethers = require('ethers');
const abi = require("./abis/ChessFactory.json");
const db = require('./db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = wallet.connect(provider);
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const createGame = async () => {
    // Convert entry fee and commission to wei
    const entryFeeInEther = ethers.parseEther("0.01");
    const commission = 5;

    const tx = await contract.createGame(entryFeeInEther, commission);
    const receipt = await tx.wait();
    const receiptHash = receipt.hash;
    console.log('receiptHash', receiptHash);
    // get the logs from the receipt hash
    const logs = await provider.getLogs({ fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber, address: contractAddress, topics: [ethers.utils.id("GameCreated(address,uint256)")] });
    console.log('logs', logs);

    return "Game created successfully!";
}

module.exports = {
    createGame,
};
