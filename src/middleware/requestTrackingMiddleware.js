const { logRequest } = require('../db/utilService');
const { v4: uuidv4 } = require('uuid');

const SESSION_COOKIE_NAME = 'sessionId';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const requestTrackingMiddleware = async (req, res, next) => {
  let sessionId = req.cookies[SESSION_COOKIE_NAME];

  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie(SESSION_COOKIE_NAME, sessionId, { 
      maxAge: SESSION_DURATION, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production'
    });
  }

  const { method, originalUrl } = req;

  try {
    await logRequest(sessionId, method, originalUrl);
  } catch (error) {
    console.error('Error logging request:', error);
  }

  next();
};

module.exports = requestTrackingMiddleware;
