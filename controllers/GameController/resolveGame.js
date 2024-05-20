const ethers = require("ethers");
const chessContractAbi = require("../../abis/Chess.json");
const {
  getGameById,
  getUserById,
  updateWinner,
  updateGameState,
} = require("../../db");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);

async function unlockGame(contractAddress) {
  const gameContract = new ethers.Contract(
    contractAddress,
    chessContractAbi.abi,
    signer,
  );
  await gameContract.unlock();
  console.log(`Game at ${contractAddress} has been unlocked.`);
}

async function distributeFunds(contractAddress, winner) {
  const gameContract = new ethers.Contract(
    contractAddress,
    chessContractAbi.abi,
    signer,
  );
  await gameContract.finishGame(winner);
  console.log(`Funds distributed for game at ${contractAddress} to ${winner}.`);
}

async function resolveGame(req, res) {
  try {
    const { gameId, winner } = req.body;
    if (!gameId || !winner) {
      console.error("Game ID and winner are required");
      return res.status(400).json({ error: "Game ID and winner are required" });
    }

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

    // Retrieve the winner's wallet address based on user ID
    let winnerWalletAddress;
    if (winner !== "0x0000000000000000000000000000000000000000") {
      const winnerUser = await getUserById(winner);
      if (!winnerUser) {
        console.error(`Winner not found for ID: ${winner}`);
        return res.status(404).json({ error: "Winner not found" });
      }
      winnerWalletAddress = winnerUser.wallet_address;
    } else {
      winnerWalletAddress = winner; // This is the zero address for a draw
    }

    await unlockGame(contractAddress);
    await distributeFunds(contractAddress, winnerWalletAddress);
    await updateWinner(gameId, winner);
    await updateGameState(gameId, 5);

    res.status(200).json({
      message: `Game at ${contractAddress} has been resolved and funds distributed.`,
    });
  } catch (error) {
    console.error("Error resolving the game:", error);
    res.status(500).json({ error: "Failed to resolve the game." });
  }
}

module.exports = {
  resolveGame,
};
