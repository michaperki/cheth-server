const { client } = require("./db");
const { getUserById } = require("./userService");

const createGame = async (whiteUserId, timeControl, wagerSize) => {
  try {
    const checkIfUserHasActiveGame = await client.query(
      "SELECT * FROM games WHERE player1_id = $1 AND state = $2",
      [whiteUserId, "0"],
    );
    if (checkIfUserHasActiveGame.rows.length > 0) {
      console.log(
        "createGame: User has an active game",
        checkIfUserHasActiveGame.rows,
      );
      return checkIfUserHasActiveGame.rows;
    } else {
      // Retrieve the user's rating based on the time control
      const user = await getUserById(whiteUserId);
      let player1Rating;
      const timeControlInt = parseInt(timeControl, 10);
      if (timeControlInt === 60) {
        player1Rating = user.bullet_rating;
      } else if (timeControlInt === 180 || timeControlInt === 300) {
        player1Rating = user.blitz_rating;
      } else {
        console.error("Invalid time control:", timeControl);
        throw new Error("Invalid time control"); // Handle invalid time control
      }

      const { rows } = await client.query(
        "INSERT INTO games (player1_id, time_control, wager, state, player1_rating) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [whiteUserId, timeControlInt, wagerSize, "0", player1Rating],
      );
      console.log("createGame: New game created", rows);
      return rows;
    }
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

const playGame = async (userId) => {
  const gamesToJoin = await client.query(
    "SELECT * FROM games WHERE player1_id != $1 AND player2_id IS NULL",
    [userId],
  );
  if (gamesToJoin.rows.length > 0) {
    const gameId = gamesToJoin.rows[0].game_id;
    await joinGame(gameId, userId);
    const { rows } = await client.query(
      "SELECT * FROM games WHERE game_id = $1",
      [gameId],
    );
    return rows;
  } else {
    return createGame(userId);
  }
};

const setPlayerReady = async (gameId, userId) => {
  const game = await getGameById(gameId);
  if (game.player1_id === userId) {
    await client.query(
      "UPDATE games SET player1_ready = TRUE WHERE game_id = $1",
      [gameId],
    );
  } else if (game.player2_id === userId) {
    await client.query(
      "UPDATE games SET player2_ready = TRUE WHERE game_id = $1",
      [gameId],
    );
  }
};

const setBothPlayersReady = async (gameId) => {
  await client.query(
    "UPDATE games SET player1_ready = TRUE, player2_ready = TRUE WHERE game_id = $1",
    [gameId],
  );
};

const cancelGame = async (gameId) => {
  const { rows } = await client.query(
    "DELETE FROM games WHERE game_id = $1 RETURNING *",
    [gameId],
  );
  return rows;
};

const cancelGameSearch = async (userId) => {
  const { rows } = await client.query(
    "DELETE FROM games WHERE player1_id = $1 AND player2_id IS NULL RETURNING *",
    [userId],
  );
  return rows;
};

const joinGame = async (gameId, userId) => {
  try {
    // Retrieve the user's rating based on the time control of the game
    const game = await getGameById(gameId);
    const user = await getUserById(userId);
    let player2Rating;
    const timeControlInt = parseInt(game.time_control, 10);
    if (timeControlInt === 60) {
      player2Rating = user.bullet_rating;
    } else if (timeControlInt === 180 || timeControlInt === 300) {
      player2Rating = user.blitz_rating;
    } else {
      console.error("Invalid time control:", game.time_control);
      throw new Error("Invalid time control"); // Handle invalid time control
    }

    const { rows } = await client.query(
      "UPDATE games SET player2_id = $1, state = 1, player2_rating = $2 WHERE game_id = $3 RETURNING *",
      [userId, player2Rating, gameId],
    );
    console.log("joinGame: Game joined", rows);
    return rows;
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};

const updateGameState = async (gameId, state) => {
  const { rows } = await client.query(
    "UPDATE games SET state = $1 WHERE game_id = $2 RETURNING *",
    [state, gameId],
  );
  return rows;
};

const updateGameContractAddress = async (gameId, contractAddress) => {
  const { rows } = await client.query(
    "UPDATE games SET contract_address = $1 WHERE game_id = $2 RETURNING *",
    [contractAddress, gameId],
  );
  return rows;
};

const updateTransactionHash = async (gameId, transactionHash) => {
  const { rows } = await client.query(
    "UPDATE games SET transaction_hash = $1 WHERE game_id = $2 RETURNING *",
    [transactionHash, gameId],
  );
  return rows;
};

const updateGameCreatorAddress = async (gameId, creatorAddress) => {
  const { rows } = await client.query(
    "UPDATE games SET game_creator_address = $1 WHERE game_id = $2 RETURNING *",
    [creatorAddress, gameId],
  );
  return rows;
};

const updateLichessId = async (gameId, lichessId) => {
  const { rows } = await client.query(
    "UPDATE games SET lichess_id = $1 WHERE game_id = $2 RETURNING *",
    [lichessId, gameId],
  );
  return rows;
};

const updateRewardPool = async (gameId, rewardPool) => {
  const { rows } = await client.query(
    "UPDATE games SET reward_pool = $1 WHERE game_id = $2 RETURNING *",
    [rewardPool, gameId],
  );
  return rows;
};

const updateWinner = async (gameId, winnerId) => {
  try {
    const { rows } = await client.query(
      "UPDATE games SET winner = $1, state = 5 WHERE game_id = $2 RETURNING *",
      [winnerId, gameId]
    );
    return rows[0];
  } catch (error) {
    console.error("Error updating winner:", error);
    throw error;
  }
};

const getGames = async (timeControl, wagerSize) => {
  const { rows } = await client.query(
    "SELECT * FROM games WHERE time_control = $1 AND wager = $2",
    [timeControl, wagerSize],
  );
  return rows;
};

const getAllGames = async () => {
  const { rows } = await client.query("SELECT * FROM games");
  return rows;
};

const getAvailableGames = async (
  timeControl,
  wagerSize,
  userId,
  userRating,
) => {
  console.log(
    `getAvailableGames: timeControl=${timeControl}, wagerSize=${wagerSize}, userId=${userId}, userRating=${userRating}`,
  );

  const { rows } = await client.query(
    `
SELECT * 
FROM games 
WHERE time_control = $1 
AND wager = $2 
AND player1_id != $3 
AND player2_id IS NULL 
AND ABS(player1_rating - $4) <= 100
`,
    [timeControl, wagerSize, userId, userRating],
  );

  console.log(`getAvailableGames: Found ${rows.length} available games`);
  console.log("getAvailableGames: Available games", rows);
  return rows;
};

const getGameById = async (gameId) => {
  try {
    const { rows } = await client.query(
      "SELECT * FROM games WHERE game_id = $1",
      [gameId],
    );
    if (rows.length === 0) {
      throw new Error(`Game not found for ID: ${gameId}`);
    }
    return rows[0];
  } catch (error) {
    console.error(`Error fetching game by ID: ${gameId}`, error);
    throw error;
  }
};

const getRewardPool = async (gameId) => {
  const { rows } = await client.query(
    "SELECT reward_pool FROM games WHERE game_id = $1",
    [gameId],
  );
  return rows[0].reward_pool;
};

const getUserGames = async (userId) => {
  const { rows } = await client.query(
    "SELECT * FROM games WHERE player1_id = $1 OR player2_id = $1",
    [userId],
  );
  return rows;
};

const updateGameBalanceForPlayer1 = async (gameId, amount) => {
  const bigIntAmount = BigInt(amount);
  const { rows } = await client.query(
    "UPDATE games SET player1_payout = $1 WHERE game_id = $2 RETURNING *",
    [bigIntAmount, gameId],
  );
  return rows;
};

const updateGameBalanceForPlayer2 = async (gameId, amount) => {
  const bigIntAmount = BigInt(amount);
  const { rows } = await client.query(
    "UPDATE games SET player2_payout = $1 WHERE game_id = $2 RETURNING *",
    [bigIntAmount, gameId],
  );
  return rows;
};

const updateCommission = async (gameId, amount) => {
  const bigIntAmount = BigInt(amount);
  const { rows } = await client.query(
    "UPDATE games SET commission = $1 WHERE game_id = $2 RETURNING *",
    [bigIntAmount, gameId],
  );
  return rows;
};

const requestRematch = async (gameId, userId) => {
  const { rows } = await client.query(
    "UPDATE games SET rematch_requested = TRUE, rematch_requested_by = $1 WHERE game_id = $2 RETURNING *",
    [userId, gameId],
  );
  return rows;
};

const acceptRematch = async (gameId, userId) => {
  const { rows } = await client.query(
    "UPDATE games SET rematch_accepted = TRUE WHERE game_id = $1 AND rematch_requested_by != $2 RETURNING *",
    [gameId, userId],
  );
  return rows;
};

const declineRematch = async (gameId) => {
  const { rows } = await client.query(
    "UPDATE games SET rematch_requested = FALSE, rematch_requested_by = NULL WHERE game_id = $1 RETURNING *",
    [gameId],
  );
  return rows;
};

const cancelRematch = async (gameId) => {
  const { rows } = await client.query(
    "UPDATE games SET rematch_requested = FALSE, rematch_requested_by = NULL, rematch_accepted = FALSE WHERE game_id = $1 RETURNING *",
    [gameId],
  );
  return rows;
};

const getGameCount = async () => {
  const { rows } = await client.query("SELECT COUNT(*) FROM games");
  return rows[0].count;
};

const getTotalWagered = async () => {
  const { rows } = await client.query("SELECT SUM(reward_pool) FROM games");
  return rows[0].sum;
};

const lockGameInDb = async (gameId) => {
  try {
    const { rows } = await client.query(
      "UPDATE games SET state = -2 WHERE game_id = $1 RETURNING *",
      [gameId],
    );
    if (rows.length === 0) {
      throw new Error(`Failed to lock game in DB for ID: ${gameId}`);
    }
    return rows[0];
  } catch (error) {
    console.error(`Error locking game in DB for ID: ${gameId}`, error);
    throw error;
  }
};

module.exports = {
  createGame,
  playGame,
  setPlayerReady,
  setBothPlayersReady,
  cancelGame,
  cancelGameSearch,
  joinGame,
  updateGameState,
  updateGameContractAddress,
  updateTransactionHash,
  updateGameCreatorAddress,
  updateLichessId,
  updateRewardPool,
  updateWinner,
  getGames,
  getAllGames,
  getAvailableGames,
  getGameById,
  getRewardPool,
  getUserGames,
  updateGameBalanceForPlayer1,
  updateGameBalanceForPlayer2,
  updateCommission,
  requestRematch,
  acceptRematch,
  declineRematch,
  cancelRematch,
  getGameCount,
  getTotalWagered,
  lockGameInDb,
};
