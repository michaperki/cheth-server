const db = require("../../db");
const WebSocket = require("ws");
const ethers = require("ethers");
const chessContractAbi = require("../../abis/Chess.json");
const factoryContractAbi = require("../../abis/ChessFactory.json");
const contractFactoryFunctions = require("../../contracts/ContractFactoryFunctions");
const { createChallenge } = require("../../../dist/utils/lichessUtils");
const { logger } = require("../../../dist/utils/LoggerUtils");

const factoryContractAddress = factoryContractAbi.networks[process.env.CHAIN_ID].address;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(provider);
const factoryContract = new ethers.Contract(factoryContractAddress, factoryContractAbi.abi, signer);

async function startGame(dbGame, clients, wagerSize) {
  try {
    logger.info(`Starting game for game_id: ${dbGame.game_id}`);

    let gameCreatedPromise = new Promise((resolve) => {
      const handleGameCreated = async (game, creator) => {
        try {
          logger.info(`GameCreated event received for game: ${game}, creator: ${creator}`);
          await updateGameDetails(dbGame.game_id, game, creator);
          sendWebSocketMessage(clients, dbGame, "CONTRACT_READY");
          
          const gameContract = new ethers.Contract(game, chessContractAbi.abi, signer);
          setupGameEventListeners(gameContract, dbGame, clients);
          
          resolve();
        } catch (error) {
          logger.error(`Error in handleGameCreated: ${error.message}`);
        }
      };

      factoryContract.once("GameCreated", handleGameCreated);
    });

    await contractFactoryFunctions.createGame(dbGame.game_id, wagerSize);
    logger.info(`Game creation initiated for game_id: ${dbGame.game_id}`);

    sendWebSocketMessage(clients, dbGame, "START_GAME");

    // Wait for the GameCreated event to be processed
    await gameCreatedPromise;

  } catch (error) {
    logger.error(`Error in startGame: ${error.message}`);
    sendErrorMessage(clients, dbGame, "Failed to start the game. Please try again.");
  }
}

async function updateGameDetails(gameId, contractAddress, creator) {
  await db.updateGameContractAddress(gameId, contractAddress);
  await db.updateGameState(gameId, 2);
  await db.updateGameCreatorAddress(gameId, creator);
  logger.info(`Game details updated for game_id: ${gameId}`);
}

function setupGameEventListeners(gameContract, dbGame, clients) {
  gameContract.on("GameJoined", async (player, entryFee) => {
    try {
      logger.info(`GameJoined event received for player: ${player}, entryFee: ${entryFee}`);
      await handleGameJoined(dbGame, player, entryFee, clients);
    } catch (error) {
      logger.error(`Error handling GameJoined event: ${error.message}`);
    }
  });

  gameContract.once("GamePrimed", async (white, black, entryFee) => {
    try {
      logger.info(`GamePrimed event received for white: ${white}, black: ${black}, entryFee: ${entryFee}`);
      await handleGamePrimed(dbGame, clients);
    } catch (error) {
      logger.error(`Error handling GamePrimed event: ${error.message}`);
    }
  });
}

async function handleGameJoined(dbGame, player, entryFee, clients) {
  const [player1_details, player2_details] = await Promise.all([
    db.getUserById(dbGame.player1_id),
    db.getUserById(dbGame.player2_id)
  ]);
  
  console.log("player1_details.wallet_address:", player1_details.wallet_address.toLowerCase());
  console.log("player2_details.wallet_address:", player2_details.wallet_address.toLowerCase());
  console.log("player:", player.toLowerCase());

  // Convert all addresses to lowercase for comparison
  const player1Address = player1_details.wallet_address.toLowerCase();
  const player2Address = player2_details.wallet_address.toLowerCase();
  const joinedPlayerAddress = player.toLowerCase();

  let player_id;
  if (joinedPlayerAddress === player1Address) {
    player_id = dbGame.player1_id;
    console.log("Player 1 joined");
  } else if (joinedPlayerAddress === player2Address) {
    player_id = dbGame.player2_id;
    console.log("Player 2 joined");
  } else {
    console.error("Joined player address doesn't match either player");
    return;
  }

  await db.setPlayerReady(dbGame.game_id, player_id);
  console.log(`Player ${player_id} set as ready`);

  const currentRewardPool = await db.getRewardPool(dbGame.game_id);
  const newRewardPool = Number(currentRewardPool) + Number(entryFee);
  await db.updateRewardPool(dbGame.game_id, newRewardPool);
  await db.updateGameState(dbGame.game_id, 3);

  sendWebSocketMessage(clients, dbGame, "GAME_JOINED", { player });
}

async function handleGamePrimed(dbGame, clients) {
  await db.setBothPlayersReady(dbGame.game_id);

  const [player1, player2] = await Promise.all([
    db.getUserById(dbGame.player1_id),
    db.getUserById(dbGame.player2_id)
  ]);

  const challengeData = await createChallenge(player1.username, player2.username, dbGame.time_control);
  console.log("after creating challenge in Lichess");
  console.log(challengeData);
  console.log("challengeData ID");
  console.log(challengeData.id);
  if (!challengeData || !challengeData.id) {
    throw new Error("Failed to create Lichess challenge");
  }

  await db.updateLichessId(dbGame.game_id, challengeData.id);
  await db.updateGameState(dbGame.game_id, 4);

  sendWebSocketMessage(clients, dbGame, "GAME_PRIMED", { creator: dbGame.game_creator_address });
}

function sendWebSocketMessage(clients, dbGame, type, additionalData = {}) {
  const message = JSON.stringify({
    type,
    gameId: dbGame.game_id,
    ...additionalData
  });

  Object.values(clients).forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN &&
        (parseInt(ws.userId) === dbGame.player1_id || parseInt(ws.userId) === dbGame.player2_id)) {
      ws.send(message);
    }
  });
}

function sendErrorMessage(clients, dbGame, errorMessage) {
  sendWebSocketMessage(clients, dbGame, "GAME_START_ERROR", { error: errorMessage });
}

module.exports = startGame;
