const { logRequest } = require('../db/utilService');
const { v4: uuidv4 } = require('uuid');

const ANONYMOUS_COOKIE_NAME = 'anonymousId';
const COOKIE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const requestTrackingMiddleware = async (req, res, next) => {
  let sessionId;
  let isLoggedIn = false;

  // If user is logged in, use their user ID
  if (req.session && req.session.userId) {
    sessionId = req.session.userId.toString();
    isLoggedIn = true;
  } else {
    // For anonymous users, use the anonymousId cookie
    sessionId = req.cookies[ANONYMOUS_COOKIE_NAME];
    if (!sessionId) {
      sessionId = uuidv4();
      res.cookie(ANONYMOUS_COOKIE_NAME, sessionId, { 
        maxAge: COOKIE_DURATION, 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production'
      });
    }
  }

  const { method, originalUrl } = req;

  try {
    await logRequest(sessionId, method, originalUrl, isLoggedIn);
  } catch (error) {
    console.error('Error logging request:', error);
  }

  next();
};

module.exports = requestTrackingMiddleware;
