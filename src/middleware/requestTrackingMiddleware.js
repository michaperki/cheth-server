const { logRequest } = require('../db/utilService');
const { v4: uuidv4 } = require('uuid');

const ANONYMOUS_COOKIE_NAME = 'anonymousId';
const COOKIE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const requestTrackingMiddleware = async (req, res, next) => {
  console.log("Request tracking middleware");
  console.log("Session:", req.session);
  console.log("Cookies:", req.cookies);

  let sessionId;
  let isLoggedIn = false;

  // Check if user is logged in
  if (req.session && req.session.userId) {
    sessionId = `user_${req.session.userId}`;
    isLoggedIn = true;
    console.log("User is logged in. Session ID:", sessionId);
  } else {
    // For anonymous users, use the anonymousId cookie
    sessionId = req.cookies[ANONYMOUS_COOKIE_NAME];
    if (!sessionId) {
      sessionId = `anon_${uuidv4()}`;
      res.cookie(ANONYMOUS_COOKIE_NAME, sessionId, { 
        maxAge: COOKIE_DURATION, 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production'
      });
      console.log("Created new anonymous session. Session ID:", sessionId);
    } else {
      console.log("Using existing anonymous session. Session ID:", sessionId);
    }
  }

  const { method, originalUrl } = req;

  try {
    await logRequest(sessionId, method, originalUrl, isLoggedIn);
    console.log("Request logged. Session ID:", sessionId, "Method:", method, "URL:", originalUrl, "Logged In:", isLoggedIn);
  } catch (error) {
    console.error('Error logging request:', error);
  }

  next();
};

module.exports = requestTrackingMiddleware;
