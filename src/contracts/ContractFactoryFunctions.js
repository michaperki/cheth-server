const ethers = require('ethers');
const abi = require("../abis/ChessFactory.json");
const db = require('../db'); // Import your database module

const contractAddress = abi.networks[process.env.CHAIN_ID].address;
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);
const contract = new ethers.Contract(contractAddress, abi.abi, signer);


const getEthToUsd = async () => {
    try {
        const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
        const response = await fetch(url);
        const data = await response.json();
        return data.ethereum.usd;
    } catch (error) {
        console.error("Error getting ETH to USD:", error);
        throw error;
    }
}

const createGame = async (gameId, entryFeeInUsd) => {
    try {
        const ethToUsd = await getEthToUsd();
        console.log("ETH to USD:", ethToUsd);

        // Calculate the entry fee in ether
        const entryFeeInEther = (entryFeeInUsd / ethToUsd).toFixed(18); // Round to 18 decimal places
        console.log("Entry fee in ether:", entryFeeInEther);

        const commission = 5;

        // Send the transaction to create the game
        const tx = await contract.createGame(ethers.parseEther(entryFeeInEther), commission);
        console.log("Transaction hash:", tx.hash);
        
        // Save the transaction hash to the database
        await db.updateTransactionHash(gameId, tx.hash);

        // Wait for the transaction to be mined
        console.log("Waiting for the transaction to be mined...");
        const receipt = await tx.wait();
        console.log("Transaction was mined!");

        console.log("Receipt:", JSON.stringify(receipt, null, 2));

        if (!receipt.gasUsed) {
            throw new Error("gasUsed is undefined in the receipt");
        }
        console.log("Gas used:", receipt.gasUsed.toString());

        if (!receipt.gasPrice) {
            throw new Error("gasPrice is undefined in the receipt");
        }
        console.log("Gas price:", receipt.gasPrice.toString());

        const gasUsed = BigInt(receipt.gasUsed);
        const gasPrice = BigInt(receipt.gasPrice);
        
        console.log("Gas used (BigInt):", gasUsed.toString());
        console.log("Gas price (BigInt):", gasPrice.toString());

        const gasFeeWei = gasUsed * gasPrice;
        console.log("Gas fee (Wei):", gasFeeWei.toString());

        const gasFeeEth = ethers.formatEther(gasFeeWei);
        console.log("Gas fee (ETH):", gasFeeEth);

        await db.storeGasFee({
            gameId,
            operationType: 'createGame',
            transactionHash: receipt.transactionHash,
            gasUsed: gasUsed.toString(),
            gasPrice: gasPrice.toString(),
            gasFeeWei: gasFeeWei.toString(),
            gasFeeEth
        });
        
        return "Game created successfully!";
    } catch (error) {
        console.error("Error creating game:", error);
        if (error.receipt) {
            console.error("Transaction receipt:", JSON.stringify(error.receipt, null, 2));
        }
        throw error;
    }
};

module.exports = {
    createGame,
};
