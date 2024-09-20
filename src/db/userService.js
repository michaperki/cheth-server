const { client } = require('./db');

const addUser = async (
    username, 
    walletAddress, 
    bulletRating, 
    blitzRating, 
    rapidRating, 
    bulletGames, 
    blitzGames, 
    rapidGames,
    rollupPlayerId
) => {
    const queryText = `
        INSERT INTO users 
            (username, wallet_address, bullet_rating, blitz_rating, rapid_rating, bullet_games, blitz_games, rapid_games, rollup_player_id) 
        VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *;
    `;
    const values = [username, walletAddress, bulletRating, blitzRating, rapidRating, bulletGames, blitzGames, rapidGames, rollupPlayerId];
    const { rows } = await client.query(queryText, values);
    return rows[0];
};

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
    walletAddress = walletAddress.toLowerCase();
    const { rows } = await client.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
    return rows.length > 0 ? rows[0] : null;
}

const toggleDarkMode = async (userId) => {
    const { rows } = await client.query('UPDATE users SET dark_mode = NOT dark_mode WHERE user_id = $1 RETURNING *', [userId]);
    return rows[0];
}

const setAvatar = async (userId, avatar) => {
    const { rows } = await client.query('UPDATE users SET avatar = $1 WHERE user_id = $2 RETURNING *', [avatar, userId]);
    return rows;
}

module.exports = {
    addUser,
    getUsers,
    getUserById,
    getUserByLichessHandle,
    getUserByWalletAddress,
    toggleDarkMode,
    setAvatar
};

