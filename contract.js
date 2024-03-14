const ethers = require('ethers');
const abi = require("./abis/ChessGame.json");

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(new ethers.JsonRpcProvider(process.env.RPC_URL));
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const startGame = async () => {
    try {
        // Replace parameters as needed
        const tx = await contract.startGame({ value: ethers.utils.parseEther('1.0') });
        await tx.wait();
        console.log('New game started.');
    } catch (error) {
        console.error('Error starting game:', error);
    }
};

const joinGame = async () => {
    try {
        // Replace parameters as needed
        const tx = await contract.joinGame({ value: ethers.utils.parseEther('1.0') });
        await tx.wait();
        console.log('Joined game.');
    } catch (error) {
        console.error('Error joining game:', error);
    }
};

contract.on('GameStarted', (gameId, playerOne, entryFee) => {
    console.log('Game started:', gameId, playerOne, entryFee);
});

contract.on('JoinedGame', (gameId, playerTwo) => {
    console.log('Game joined:', gameId, playerTwo);
});

contract.on('GameFinished', (gameId, winner, reward) => {
    console.log('Game finished:', gameId, winner, reward);
});

module.exports = {
    startGame,
    joinGame
};
