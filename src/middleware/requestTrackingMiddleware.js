const { logRequest } = require('../db/utilService');
const { v4: uuidv4 } = require('uuid');

const requestTrackingMiddleware = async (req, res, next) => {
  // Generate a new session ID if one doesn't exist
  if (!req.sessionID) {
    req.sessionID = uuidv4();
  }

  const { method, originalUrl } = req;

  try {
    await logRequest(req.sessionID, method, originalUrl);
  } catch (error) {
    console.error('Error logging request:', error);
  }

  next();
};

module.exports = requestTrackingMiddleware;
