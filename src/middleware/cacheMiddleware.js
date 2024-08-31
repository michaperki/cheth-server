const NodeCache = require('node-cache');

// Create a new cache instance with a default TTL of 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

const cacheMiddleware = (duration) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    res.send(cachedResponse);
  } else {
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    next();
  }
};

module.exports = cacheMiddleware;
