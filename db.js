// errorHandlingMiddleware.js
const handleErrors = require('./middleware/errorHandlingMiddleware');
const { logger } = require('./utils/LoggerUtils'); // Import the logger instance and expressLogger middleware

const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const connectToDatabase = async () => {
    await client.connect();
    logger.info('Connected to the database');
};

const getConfig = async () => {
    const { rows } = await client.query('SELECT * FROM config');
    return rows;
};

const addUser = async (username, rating, walletAddress, darkMode) => {
    const { rows } = await client.query('INSERT INTO users (username, rating, wallet_address, dark_mode) VALUES ($1, $2, $3, $4) RETURNING *', [username, rating, walletAddress, darkMode]);
    return rows;
}

const getUsers = async () => {
    const { rows } = await client.query('SELECT * FROM users');
    return rows;
}

const getUserById = async (userId) => {
    const { rows } = await client.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    return rows.length > 0 ? rows[0] : null;
}

const getUserByLichessHandle = async (lichessHandle) => {
    const { rows } = await client.query('SELECT * FROM users WHERE username ILIKE $1', [lichessHandle]);
    return rows.length > 0 ? rows[0] : null;
}

const getUserByWalletAddress = async (walletAddress) => {
    const { rows } = await client.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
    return rows.length > 0 ? rows[0] : null;
}

const createGame = async (whiteUserId, timeControl, wagerSize) => {
    const checkIfUserHasActiveGame = await client.query('SELECT * FROM games WHERE player1_id = $1 AND state = $2', [whiteUserId, '0']);

    if (checkIfUserHasActiveGame.rows.length > 0) {
        return checkIfUserHasActiveGame.rows;
    } else {
        const { rows } = await client.query('INSERT INTO games (player1_id, time_control, wager, state) VALUES ($1, $2, $3, $4) RETURNING *', [whiteUserId, timeControl, wagerSize, '0']);
        return rows;
    }
}

const playGame = async (userId) => {
    const gamesToJoin = await client.query('SELECT * FROM games WHERE player1_id != $1 AND player2_id IS NULL', [userId]);
    if (gamesToJoin.rows.length > 0) {
        const gameId = gamesToJoin.rows[0].game_id;
        await joinGame(gameId, userId);
        const { rows } = await client.query('SELECT * FROM games WHERE game_id = $1', [gameId]);
        return rows;
    } else {
        return createGame(userId);
    }
}

const cancelGame = async (gameId) => {
    const { rows } = await client.query('DELETE FROM games WHERE game_id = $1 RETURNING *', [gameId]);
    return rows;
}

const joinGame = async (gameId, userId) => {
    const { rows } = await client.query('UPDATE games SET player2_id = $1, state = 1 WHERE game_id = $2 RETURNING *', [userId, gameId]);
    return rows;
}

const updateGameState = async (gameId, state) => {
    const { rows } = await client.query('UPDATE games SET state = $1 WHERE game_id = $2 RETURNING *', [state, gameId]);
    return rows;
}

const updateGameContractAddress = async (gameId, contractAddress) => {
    const { rows } = await client.query('UPDATE games SET contract_address = $1 WHERE game_id = $2 RETURNING *', [contractAddress, gameId]);
    return rows;
}

const updateTransactionHash = async (gameId, transactionHash) => {
    const { rows } = await client.query('UPDATE games SET transaction_hash = $1 WHERE game_id = $2 RETURNING *', [transactionHash, gameId]);
    return rows;
}

const updateGameCreatorAddress = async (gameId, creatorAddress) => {
    const { rows } = await client.query('UPDATE games SET game_creator_address = $1 WHERE game_id = $2 RETURNING *', [creatorAddress, gameId]);
    return rows;
}

const updateLichessId = async (gameId, lichessId) => {
    const { rows } = await client.query('UPDATE games SET lichess_id = $1 WHERE game_id = $2 RETURNING *', [lichessId, gameId]);
    return rows;
}

const updateRewardPool = async (gameId, rewardPool) => {
    const { rows } = await client.query('UPDATE games SET reward_pool = $1 WHERE game_id = $2 RETURNING *', [rewardPool, gameId]);
    return rows;
}

const updateWinner = async (gameId, winnerId) => {
    const { rows } = await client.query('UPDATE games SET winner = $1 WHERE game_id = $2 RETURNING *', [winnerId, gameId]);
    return rows;
}

const getGames = async (timeControl, wagerSize) => {
    const { rows } = await client.query('SELECT * FROM games WHERE time_control = $1 AND wager = $2', [timeControl, wagerSize]);
    return rows;
}

const getAvailableGames = async () => {
    const { rows } = await client.query('SELECT * FROM games WHERE player2_id IS NULL');
    return rows;
}

const getGameById = async (gameId) => {
    const { rows } = await client.query('SELECT * FROM games WHERE game_id = $1', [gameId]);
    return rows[0];
}

const getRewardPool = async (gameId) => {
    const { rows } = await client.query('SELECT reward_pool FROM games WHERE game_id = $1', [gameId]);
    return rows[0].reward_pool;
}

const toggleDarkMode = async (userId) => {
    const { rows } = await client.query('UPDATE users SET dark_mode = NOT dark_mode WHERE user_id = $1 RETURNING *', [userId]);
    return rows[0];
}

const getGameCount = async () => {
    logger.info('Fetching game count...');
    const { rows } = await client.query('SELECT COUNT(*) FROM games');
    return rows[0].count;
}

const getTotalWagered = async () => {
    logger.info('Fetching total wagered amount...');
    const { rows } = await client.query('SELECT SUM(reward_pool) FROM games');
    return rows[0].sum;
}

module.exports = {
    connectToDatabase: handleErrors(connectToDatabase),
    getConfig: handleErrors(getConfig),
    addUser: handleErrors(addUser),
    getUsers: handleErrors(getUsers),
    getUserById: handleErrors(getUserById),
    getUserByLichessHandle: handleErrors(getUserByLichessHandle),
    getUserByWalletAddress: handleErrors(getUserByWalletAddress),
    createGame: handleErrors(createGame),
    playGame: handleErrors(playGame),
    cancelGame: handleErrors(cancelGame),
    joinGame: handleErrors(joinGame),
    updateGameState: handleErrors(updateGameState),
    updateGameContractAddress: handleErrors(updateGameContractAddress),
    updateTransactionHash: handleErrors(updateTransactionHash),
    updateGameCreatorAddress: handleErrors(updateGameCreatorAddress),
    updateLichessId: handleErrors(updateLichessId),
    updateRewardPool: handleErrors(updateRewardPool),
    updateWinner: handleErrors(updateWinner),
    getGames: handleErrors(getGames),
    getAvailableGames: handleErrors(getAvailableGames),
    getGameById: handleErrors(getGameById),
    getRewardPool: handleErrors(getRewardPool),
    toggleDarkMode: handleErrors(toggleDarkMode),
    getGameCount: handleErrors(getGameCount),
    getTotalWagered: handleErrors(getTotalWagered)
};
