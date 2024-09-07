const { client } = require('./db');

const logRequest = async (sessionId, method, url, isLoggedIn) => {
  try {
    await client.query(
      'INSERT INTO request_logs (session_id, method, url, is_logged_in) VALUES ($1, $2, $3, $4)',
      [sessionId, method, url, isLoggedIn]
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
        AVG(requests_per_session) as avg_requests_per_session,
        COUNT(DISTINCT CASE WHEN is_logged_in THEN session_id END) as logged_in_users,
        COUNT(DISTINCT CASE WHEN NOT is_logged_in THEN session_id END) as anonymous_users
      FROM (
        SELECT session_id, is_logged_in, COUNT(*) as requests_per_session 
        FROM request_logs 
        GROUP BY session_id, is_logged_in
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
