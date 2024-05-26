const db = require("../db");
const {
  GameNotFoundError,
  InvalidGameStateError,
} = require("../../dist/utils/errors");
const WebSocket = require("ws");

function parseGameInfo(gameInfo) {
  console.log("parseGameInfo function");

  // Split the response text by line breaks
  const lines = gameInfo.split("\n");

  // Initialize an object to store the extracted information
  const parsedInfo = {};

  // Iterate over each line and parse the key-value pairs
  lines.forEach((line) => {
    // Extract key-value pairs using regex
    const match = line.match(/^\[(.*?)\s"(.*?)"\]$/);
    if (match) {
      const key = match[1];
      const value = match[2];
      parsedInfo[key] = value;
    }
  });

  return parsedInfo;
}

function handleError(res, error) {
  // Customize the response based on the error type
  if (error instanceof GameNotFoundError) {
    res.status(404).json({ error: "Game not found" });
  } else if (error instanceof InvalidGameStateError) {
    res.status(400).json({ error: "Invalid game state for this operation" });
  } else {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "Internal server error" });
  }
}

async function checkGameExists(gameId) {
  const game = await db.getGameById(gameId);
  if (!game) {
    throw new GameNotFoundError(`Game with ID ${gameId} not found.`);
  }
}

async function isGameInState(gameId, state) {
  const game = await db.getGameById(gameId);
  if (game.state !== state) {
    throw new InvalidGameStateError(`Game state is not ${state}.`);
  }
}

function validateContractAddress(contractAddress) {
  if (!contractAddress) {
    throw new Error("Contract address not found");
  }
}

async function handleFundsTransferred(to, amount, gameId, wss) {
  const amountString = amount.toString();
  const player = await db.getUserByWalletAddress(to);
  const message = JSON.stringify({
    type: "FUNDS_TRANSFERRED",
    userID: player.user_id,
    to,
    amount: amountString,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  // Additional logic to update the database based on the amount transferred...
}

async function fetchGameInfo(lichessId) {
  const url = `https://lichess.org/game/export/${lichessId}`;
  const headers = { Authorization: "Bearer " + process.env.LICHESS_TOKEN };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Failed to fetch game information from Lichess");
  }
  return parseGameInfo(await response.text());
}

function determineWinner(gameInfo) {
  return gameInfo.Result === "1-0"
    ? gameInfo.White
    : gameInfo.Result === "0-1"
      ? gameInfo.Black
      : "Draw";
}

async function getValidGame(gameId) {
  await checkGameExists(gameId);
  return db.getGameById(gameId);
}

function notifyClientsOfGameOver(wss, gameId, winnerHandle) {
  const gameOverMessage = JSON.stringify({
    type: "GAME_OVER",
    gameId,
    winner: winnerHandle,
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(gameOverMessage);
    }
  });
}

module.exports = {
  parseGameInfo,
  handleError,
  checkGameExists,
  isGameInState,
  validateContractAddress,
  handleFundsTransferred,
  fetchGameInfo,
  determineWinner,
  getValidGame,
  notifyClientsOfGameOver,
};
