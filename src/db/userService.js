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

const createUserSession = async (userId, sessionId) => {
  console.log('👽 createUserSession ~ userId', userId);
  console.log('👽 createUserSession ~ sessionId', sessionId);
  const query = `
    INSERT INTO sessions (user_id, virtual_labs_session_id, created_at, last_used_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  try {
    const result = await client.query(query, [userId, sessionId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createUserSession:', error);
    throw error; // Re-throw the error so it can be handled by the calling function
  }
};

const getExistingSession = async (walletAddress) => {
  const query = `
    SELECT s.* 
    FROM sessions s
    JOIN users u ON s.user_id = u.user_id
    WHERE u.wallet_address = $1 AND s.active = true
    ORDER BY s.created_at DESC
    LIMIT 1
  `;
  const { rows } = await client.query(query, [walletAddress]);
  return rows.length > 0 ? rows[0] : null;
};

const upsertUser = async (
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
    ON CONFLICT (wallet_address) 
    DO UPDATE SET
      username = EXCLUDED.username,
      bullet_rating = EXCLUDED.bullet_rating,
      blitz_rating = EXCLUDED.blitz_rating,
      rapid_rating = EXCLUDED.rapid_rating,
      bullet_games = EXCLUDED.bullet_games,
      blitz_games = EXCLUDED.blitz_games,
      rapid_games = EXCLUDED.rapid_games,
      rollup_player_id = EXCLUDED.rollup_player_id
    RETURNING *;
  `;
  const values = [username, walletAddress, bulletRating, blitzRating, rapidRating, bulletGames, blitzGames, rapidGames, rollupPlayerId];
  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const updateUserSession = async (userId, virtualLabsSessionId) => {
  const queryText = `
    INSERT INTO sessions (user_id, virtual_labs_session_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id) 
    DO UPDATE SET
      virtual_labs_session_id = EXCLUDED.virtual_labs_session_id,
      last_used_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const result = await client.query(queryText, [userId, virtualLabsSessionId]);
  return result.rows[0];
};

module.exports = {
    addUser,
    getUsers,
    getUserById,
    getUserByLichessHandle,
    getUserByWalletAddress,
    toggleDarkMode,
    setAvatar,
    createUserSession,
    getExistingSession,
    upsertUser,
    updateUserSession
};

