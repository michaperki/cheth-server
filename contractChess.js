const ethers = require('ethers');
const abi = require("./abis/Chess.json");
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = wallet.connect(provider);

const cancelGame = async (contractAddress) => {
    const contract = new ethers.Contract(contractAddress, abi.abi, signer);
    await contract.cancelGame();
}

const finishGame = async (contractAddress, winnerAddress) => {
    const contract = new ethers.Contract(contractAddress, abi.abi, signer);
    await contract.finishGame(winnerAddress);
}

const getContractBalance = async (contractAddress) => {
    const balance = await provider.getBalance(contractAddress);
    return balance;
}

module.exports = {
    cancelGame,
    finishGame,
    getContractBalance // Add the new function to export
};