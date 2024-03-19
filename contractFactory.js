const ethers = require('ethers');
const abi = require("./abis/ChessFactory.json");
const db = require('./db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(new ethers.JsonRpcProvider(process.env.RPC_URL));
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const createGame = async () => {
    const entryFee = "0.01";
    const commission = "5";

    const tx = await contract.createGame(entryFee, commission);
    const receipt = await tx.wait();
    console.log('receipt', receipt);
    const gameId = receipt.events[0].args.gameId;
    return gameId;
}

module.exports = {
    createGame,
};