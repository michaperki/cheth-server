const { parse } = require('dotenv');
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const connectToDatabase = async () => {
    try {
        await client.connect();
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
};

const getConfig = async () => {
    try {
        const { rows } = await client.query('SELECT * FROM config');
        return rows;
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
};

const addUser = async (username, rating, walletAddress, darkMode) => {
    try {
        const { rows } = await client.query('INSERT INTO users (username, rating, wallet_address, dark_mode) VALUES ($1, $2, $3, $4) RETURNING *', [username, rating, walletAddress, darkMode]);
        return rows;
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}

const getUserByLichessHandle = async (lichessHandle) => {
    try {
        const { rows } = await client.query('SELECT * FROM users WHERE username = $1', [lichessHandle]);
        return rows.length > 0 ? rows[0] : null; // Return the first row if found, otherwise return null
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}

const getUserByWalletAddress = async (walletAddress) => {
    console.log('walletAddress', walletAddress)
    try {
        const { rows } = await client.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
        return rows.length > 0 ? rows[0] : null; // Return the first row if found, otherwise return null
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}

const createGame = async (whiteUserId) => {
    console.log('createGame in db for whiteUserID: ', whiteUserId);
    try {
        // Check if the user already has an active game
        const checkIfUserHasActiveGame = await client.query('SELECT * FROM games WHERE player1_id = $1 AND state = $2', [whiteUserId, '0']);

        if (checkIfUserHasActiveGame.rows.length > 0) {
            console.log('User already has an active game');
            return checkIfUserHasActiveGame.rows;
        } else {
            console.log('User does not have an active game, creating a new game');
            // Insert a new game into the database
            const { rows } = await client.query('INSERT INTO games (player1_id, state) VALUES ($1, $2) RETURNING *', [whiteUserId, '0']);
            return rows;
        }
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}


const playGame = async (userId) => {
    console.log('playGame in db for userId: ', userId)
    try {
        const gamesToJoin = await client.query('SELECT * FROM games WHERE player1_id != $1 AND player2_id IS NULL', [userId]);
        if (gamesToJoin.rows.length > 0) {
            console.log('Game found to join');
            const gameId = gamesToJoin.rows[0].game_id;
            await joinGame(gameId, userId); // Await the joinGame function
            console.log('Game joined');

            // Return the game that was joined
            const { rows } = await client.query('SELECT * FROM games WHERE game_id = $1', [gameId]);
            return rows;
        }
        else {
            console.log('No game found to join, creating a new game for user', userId);
            return createGame(userId); // Return the result of createGame
        }
    }
    catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}

const joinGame = async (gameId, userId) => {
    console.log('joinGame in db for gameId: ', gameId, 'userId: ', userId);
    try {
        // Update the game's player2_id and state to 1
        const { rows } = await client.query('UPDATE games SET player2_id = $1, state = 1 WHERE game_id = $2 RETURNING *', [userId, gameId]);
        return rows;
    } catch (error) {
        console.error('Error joining game', error.stack);
        throw error;
    }
}

const updateGameState = async (gameId, state) => {
    try {
        console.log('updateGameState in db for gameId: ', gameId, 'state: ', state);
        if (typeof state === 'string') {
            console.log('state is a string, converting to integer');
            state = parseInt(state);
            console.log('state is now', state);
        }
        const { rows } = await client.query('UPDATE games SET state = $1 WHERE game_id = $2 RETURNING *', [state, gameId]);
        return rows;
    } catch (error) {
        console.error('Error updating game state', error.stack);
        throw error;
    }
}

const updateRewardPool = async (gameId, rewardPool) => {
    try {
        console.log('updateRewardPool in db for gameId: ', gameId, 'rewardPool: ', rewardPool);
        const { rows } = await client.query('UPDATE games SET reward_pool = $1 WHERE game_id = $2 RETURNING *', [rewardPool, gameId]);
        return rows;
    } catch (error) {
        console.error('Error updating reward pool', error.stack);
        throw error;
    }
}

const getGameById = async (gameId) => {
    try {
        const { rows } = await client.query('SELECT * FROM games WHERE game_id = $1', [gameId]);
        return rows[0];
    } catch (error) {
        console.error('Error executing query', error.stack);
        throw error;
    }
}


module.exports = {
    connectToDatabase,
    getConfig,
    addUser,
    getUserByLichessHandle,
    getUserByWalletAddress,
    createGame,
    playGame,
    updateGameState,
    updateRewardPool,
    getGameById
};
