const { client } = require('./db');
const { v4: uuidv4 } = require('uuid');

const logRequest = async (sessionId, method, url) => {
  try {
    // If sessionId is 'anonymous', generate a new UUID
    const actualSessionId = sessionId === 'anonymous' ? uuidv4() : sessionId;
    
    await client.query(
      'INSERT INTO request_logs (session_id, method, url) VALUES ($1, $2, $3)',
      [actualSessionId, method, url]
    );
  } catch (error) {
    console.error('Error logging request to database:', error);
  }
};

const getRequestStats = async () => {
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_requests, 
        COUNT(DISTINCT session_id) as unique_sessions,
        AVG(requests_per_session) as avg_requests_per_session
      FROM (
        SELECT session_id, COUNT(*) as requests_per_session 
        FROM request_logs 
        GROUP BY session_id
      ) as session_counts
    `);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting request stats:', error);
    return null;
  }
};

module.exports = {
  logRequest,
  getRequestStats,
};
