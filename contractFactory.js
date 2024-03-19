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

    // Retrieve the transaction receipt
    const receiptFromProvider = await provider.getTransactionReceipt(receiptHash);

    // Filter logs by contract address and event signature
    const contractInterface = new ethers.Interface(abi.abi); // Use the ABI of your contract
    const eventFilter = contractInterface.getEvent("GameCreated");
    console.log('eventFilter', eventFilter);

    const filteredLogs = receiptFromProvider.logs.filter(log => {
        return log.address.toLowerCase() === contractAddress.toLowerCase() && log.topics[0] === eventFilter.topic;
    });
    console.log('filteredLogs', filteredLogs);

    // Extract the address of the newly created contract from the logs
    const newContractAddress = ethers.getAddress("0x" + filteredLogs[0].data.slice(26)); // Assuming address is at index 0
    console.log('New contract address:', newContractAddress);

    return "Game created successfully!";
}

module.exports = {
    createGame,
};
