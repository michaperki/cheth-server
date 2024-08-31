const { client } = require('./db');
const redis = require('../utils/cache');

const addUser = async (
    username, 
    walletAddress, 
    bulletRating, 
    blitzRating, 
    rapidRating, 
    bulletGames, 
    blitzGames, 
    rapidGames
) => {
    const queryText = `
        INSERT INTO users 
            (username, wallet_address, bullet_rating, blitz_rating, rapid_rating, bullet_games, blitz_games, rapid_games) 
        VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *;
    `;
    const values = [username, walletAddress, bulletRating, blitzRating, rapidRating, bulletGames, blitzGames, rapidGames];
    const { rows } = await client.query(queryText, values);
    return rows;
};

const getUsers = async () => {
    const { rows } = await client.query('SELECT * FROM users');
    return rows;
}

const getUserById = async (userId) => {
    const cacheKey = `user:${userId}`;
    let userData = await redis.get(cacheKey);
    if (userData) {
        return JSON.parse(userData);
    }
    const { rows } = await client.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    if (rows.length > 0) {
        await redis.set(cacheKey, JSON.stringify(rows[0]), 'EX', 3600); // Cache for 1 hour
        return rows[0];
    }
    return null;
}

const getUserByLichessHandle = async (lichessHandle) => {
    const { rows } = await client.query('SELECT * FROM users WHERE username ILIKE $1', [lichessHandle]);
    return rows.length > 0 ? rows[0] : null;
}

const getUserByWalletAddress = async (walletAddress) => {
    const cacheKey = `user:wallet:${walletAddress.toLowerCase()}`;
    let userData = await redis.get(cacheKey);
    
    if (userData) {
        return JSON.parse(userData);
    }

    walletAddress = walletAddress.toLowerCase();
    const { rows } = await client.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
    if (rows.length > 0) {
        await redis.set(cacheKey, JSON.stringify(rows[0]), 'EX', 3600); // Cache for 1 hour
        return rows[0];
    }
    return null;
};

const toggleDarkMode = async (userId) => {
    const { rows } = await client.query('UPDATE users SET dark_mode = NOT dark_mode WHERE user_id = $1 RETURNING *', [userId]);
    return rows[0];
}

const setAvatar = async (userId, avatar) => {
    const { rows } = await client.query('UPDATE users SET avatar = $1 WHERE user_id = $2 RETURNING *', [avatar, userId]);
    return rows;
}

const invalidateUserCache = async (userId, walletAddress) => {
    await redis.del(`user:${userId}`);
    await redis.del(`user:wallet:${walletAddress.toLowerCase()}`);
};

module.exports = {
    addUser,
    getUsers,
    getUserById,
    getUserByLichessHandle,
    getUserByWalletAddress,
    toggleDarkMode,
    setAvatar,
    invalidateUserCache
};

