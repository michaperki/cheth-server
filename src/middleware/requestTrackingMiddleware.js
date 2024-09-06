const db = require('../db');

const requestTrackingMiddleware = async (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || 'anonymous';
  const { method, originalUrl } = req;

  try {
    await db.logRequest(sessionId, method, originalUrl);
  } catch (error) {
    console.error('Error logging request:', error);
  }

  next();
};

module.exports = requestTrackingMiddleware;
