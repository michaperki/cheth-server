// controllers/GameController/lockGame.js

const ethers = require("ethers");
const chessContractAbi = require("../../abis/Chess.json");
const { lockGameInDb, getGameById } = require("../../db/gameService");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);

async function lockGame(contractAddress) {
  const gameContract = new ethers.Contract(
    contractAddress,
    chessContractAbi.abi,
    signer,
  );
  await gameContract.lock();
  console.log(`Game at ${contractAddress} has been locked.`);
}

async function unlockGame(contractAddress) {
  const gameContract = new ethers.Contract(
    contractAddress,
    chessContractAbi.abi,
    signer,
  );
  await gameContract.unlock();
  console.log(`Game at ${contractAddress} has been unlocked.`);
}

async function reportIssue(req, res) {
  try {
    const { gameId } = req.body;
    if (!gameId) {
      console.error("Game ID is required");
      return res.status(400).json({ error: "Game ID is required" });
    }

    console.log(`Fetching game with ID: ${gameId}`);
    // Retrieve the game using the game ID
    const game = await getGameById(gameId);
    if (!game) {
      console.error(`Game not found for ID: ${gameId}`);
      return res.status(404).json({ error: "Game not found" });
    }

    const contractAddress = game.contract_address;
    if (!contractAddress) {
      console.error(`Contract address not found for game ID: ${gameId}`);
      return res.status(400).json({ error: "Contract address not found" });
    }

    console.log(`Locking game with contract address: ${contractAddress}`);
    await lockGame(contractAddress);
    console.log(`Locking game in DB for game ID: ${gameId}`);
    await lockGameInDb(gameId); // Lock the game in the database
    res
      .status(200)
      .json({ message: `Game at ${contractAddress} has been locked.` });
  } catch (error) {
    console.error("Error locking the game:", error);
    res.status(500).json({ error: "Failed to lock the game." });
  }
}

module.exports = {
  lockGame,
  unlockGame,
  reportIssue,
};
