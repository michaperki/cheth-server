// db/sessionService.js
const { client } = require('./db');

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
    throw error;
  }
};

const getExistingSession = async (walletAddress) => {
  const query = `
    SELECT s.* 
    FROM sessions s
    JOIN users u ON s.user_id = u.user_id
    WHERE u.wallet_address = $1
    ORDER BY s.created_at DESC
    LIMIT 1
  `;
  const { rows } = await client.query(query, [walletAddress]);
  return rows.length > 0 ? rows[0] : null;
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

const getSessionByWalletAddress = async (walletAddress) => {
  console.log('👽 getSessionByWalletAddress ~ walletAddress', walletAddress);
  const query = `
    SELECT s.* 
    FROM sessions s
    JOIN users u ON s.user_id = u.user_id
    WHERE u.wallet_address = $1
    ORDER BY s.last_used_at DESC
    LIMIT 1
  `;
  const { rows } = await client.query(query, [walletAddress]);
  console.log('👽 getSessionByWalletAddress ~ rows', rows);
  return rows.length > 0 ? rows[0] : null;
};

module.exports = {
  createUserSession,
  getExistingSession,
  updateUserSession,
  getSessionByWalletAddress
};
