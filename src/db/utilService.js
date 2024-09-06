const logRequest = async (sessionId, method, url) => {
  try {
    await client.query(
      'INSERT INTO request_logs (session_id, method, url) VALUES ($1, $2, $3)',
      [sessionId, method, url]
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
  getRequestStats
};
