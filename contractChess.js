const ethers = require('ethers');
const abi = require("./abis/Chess.json");
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = wallet.connect(provider);

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