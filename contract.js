const ethers = require('ethers');
const abi = require("./abis/ChessGame.json");

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(new ethers.providers.JsonRpcProvider(process.env.RPC_URL));
const contract = new ethers.Contract(contractAddress, abi.abi, signer);

const createGameContract = async (gameId, buyInAmount) => {
    console.log('Creating a new game contract for game ID:', gameId);
    try {
        const tx = await contract.createGame(gameId, buyInAmount);
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Error creating game contract:', error);
        throw error;
    }
}

const joinGameContract = async (gameId) => {
    console.log('Joining game contract for game ID:', gameId);
    try {
        const tx = await contract.joinGame(gameId, { value: ethers.utils.parseEther('0.01') });
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Error joining game contract:', error);
        throw error;
    }
}

const endGameContract = async (gameId, winner) => {
    console.log('Ending game contract for game ID:', gameId);
    try {
        const tx = await contract.endGame(gameId, winner);
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Error ending game contract:', error);
        throw error;
    }
}

const abortGameContract = async (gameId) => {
    console.log('Aborting game contract for game ID:', gameId);
    try {
        const tx = await contract.abortGame(gameId);
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Error aborting game contract:', error);
        throw error;
    }
}

const withdrawWinningsContract = async (gameId) => {
    console.log('Withdrawing winnings from game contract for game ID:', gameId);
    try {
        const tx = await contract.withdrawWinnings(gameId);
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error('Error withdrawing winnings from game contract:', error);
        throw error;
    }
}


module.exports = {
    createGameContract,
    joinGameContract,
    endGameContract,
    abortGameContract,
    withdrawWinningsContract
};
